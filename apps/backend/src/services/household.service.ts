import { createHash, randomBytes } from "crypto";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "../config/database.js";
import { hashPassword } from "../utils/password.js";
import { subcategoryService } from "./subcategory.service.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  generateTokenFamily,
} from "../utils/jwt.js";
import {
  NotFoundError,
  AuthorizationError,
  ConflictError,
  ValidationError,
} from "../utils/errors.js";
import { audited } from "./audit.service.js";
import type { ActorCtx } from "./audit.service.js";

const INVITE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const IDLE_SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const ABSOLUTE_SESSION_MS = 30 * 24 * 60 * 60 * 1000;

function normalizeEmail(email?: string | null): string | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  return normalized || null;
}

function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function assertOwner(householdId: string, userId: string) {
  const m = await prisma.member.findFirst({
    where: { householdId, userId },
  });
  if (!m || m.role !== "owner") {
    throw new AuthorizationError("Only household owners can perform this action");
  }
  return m;
}

async function assertMember(householdId: string, userId: string) {
  const m = await prisma.member.findFirst({
    where: { householdId, userId },
  });
  if (!m) throw new AuthorizationError("Not a member of this household");
  return m;
}

export function assertOwnerOrAdmin(role: string): void {
  if (role !== "owner" && role !== "admin") {
    throw new AuthorizationError("Only household owners or admins can perform this action");
  }
}

type UpdateMemberRoleParams = {
  householdId: string;
  callerId: string;
  targetUserId: string;
  newRole: "member" | "admin";
};

export async function updateMemberRole(
  db: PrismaClient,
  { householdId, callerId, targetUserId, newRole }: UpdateMemberRoleParams,
  ctx?: ActorCtx
) {
  const [caller, target] = await Promise.all([
    db.householdMember.findUnique({
      where: { householdId_userId: { householdId, userId: callerId } },
    }),
    db.householdMember.findUnique({
      where: { householdId_userId: { householdId, userId: targetUserId } },
    }),
  ]);

  if (!caller || !target) throw new NotFoundError("Member not found");

  // Cannot change owner role
  if (target.role === "owner") {
    throw new AuthorizationError("Cannot change the role of a household owner");
  }

  // Admin cannot act on another admin
  if (caller.role === "admin" && target.role === "admin") {
    throw new AuthorizationError("Admins cannot change the role of another admin");
  }

  // Admin cannot demote — only promote
  if (caller.role === "admin" && newRole === "member") {
    throw new AuthorizationError("Admins can only promote members, not demote");
  }

  // Must be owner or admin
  assertOwnerOrAdmin(caller.role);

  if (ctx) {
    return audited({
      db: prisma,
      ctx,
      action: "UPDATE_MEMBER_ROLE",
      resource: "household-member",
      resourceId: targetUserId,
      beforeFetch: async (tx) =>
        tx.householdMember.findUnique({
          where: { householdId_userId: { householdId, userId: targetUserId } },
        }) as Promise<Record<string, unknown> | null>,
      mutation: async (tx) =>
        tx.householdMember.update({
          where: { householdId_userId: { householdId, userId: targetUserId } },
          data: { role: newRole },
        }),
    });
  }

  return db.householdMember.update({
    where: { householdId_userId: { householdId, userId: targetUserId } },
    data: { role: newRole },
  });
}

export const householdService = {
  // ─── Household CRUD ────────────────────────────────────────────────────────

  async createHousehold(userId: string, name: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    const household = await prisma.household.create({
      data: { name },
    });
    await prisma.member.create({
      data: {
        householdId: household.id,
        userId,
        name: user?.name ?? "Owner",
        role: "owner",
      },
    });
    await prisma.householdSettings.create({ data: { householdId: household.id } });
    await subcategoryService.seedDefaults(household.id);
    return household;
  },

  async getUserHouseholds(userId: string) {
    return prisma.member.findMany({
      where: { userId },
      include: {
        household: {
          include: {
            _count: { select: { memberProfiles: true } },
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });
  },

  async switchHousehold(userId: string, householdId: string) {
    await assertMember(householdId, userId);
    await prisma.user.update({
      where: { id: userId },
      data: { activeHouseholdId: householdId },
    });
  },

  async getHouseholdDetails(householdId: string, requestingUserId: string) {
    await assertMember(householdId, requestingUserId);

    return prisma.household.findUnique({
      where: { id: householdId },
      include: {
        memberProfiles: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { joinedAt: "asc" },
        },
        invites: {
          where: { usedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },

  async renameHousehold(householdId: string, ownerUserId: string, name: string) {
    await assertOwner(householdId, ownerUserId);
    return prisma.household.update({ where: { id: householdId }, data: { name } });
  },

  // ─── Members ───────────────────────────────────────────────────────────────

  async removeMember(householdId: string, ownerUserId: string, memberId: string, ctx?: ActorCtx) {
    await assertOwner(householdId, ownerUserId);
    const target = await prisma.member.findUnique({ where: { id: memberId } });
    if (!target || target.householdId !== householdId) {
      throw new NotFoundError("Member not found");
    }
    if (target.userId === ownerUserId) {
      throw new ValidationError("Owner cannot remove themselves from the household");
    }

    if (ctx) {
      await audited({
        db: prisma,
        ctx,
        action: "REMOVE_MEMBER",
        resource: "member",
        resourceId: memberId,
        beforeFetch: async (tx) =>
          tx.member.findUnique({ where: { id: memberId } }) as Promise<Record<
            string,
            unknown
          > | null>,
        mutation: async (tx) => tx.member.delete({ where: { id: memberId } }),
      });
    } else {
      await prisma.member.delete({ where: { id: memberId } });
    }

    // Clear stale activeHouseholdId if the removed member had a linked user
    if (target.userId) {
      const user = await prisma.user.findUnique({
        where: { id: target.userId },
        select: { activeHouseholdId: true },
      });
      if (user?.activeHouseholdId === householdId) {
        const otherMembership = await prisma.member.findFirst({
          where: { userId: target.userId },
          orderBy: { joinedAt: "asc" },
        });
        await prisma.user.update({
          where: { id: target.userId },
          data: { activeHouseholdId: otherMembership?.householdId ?? null },
        });
      }
    }
  },

  async leaveHousehold(householdId: string, userId: string) {
    const member = await prisma.member.findFirst({
      where: { householdId, userId },
    });
    if (!member) throw new NotFoundError("You are not a member of this household");

    if (member.role === "owner") {
      const ownerCount = await prisma.member.count({
        where: { householdId, role: "owner" },
      });
      if (ownerCount <= 1) {
        throw new ValidationError("You are the sole owner of this household and cannot leave");
      }
    }

    await prisma.member.delete({ where: { id: member.id } });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { activeHouseholdId: true },
    });

    if (user?.activeHouseholdId === householdId) {
      const otherMembership = await prisma.member.findFirst({
        where: { userId },
        orderBy: { joinedAt: "asc" },
      });
      await prisma.user.update({
        where: { id: userId },
        data: { activeHouseholdId: otherMembership?.householdId ?? null },
      });
    }
  },

  // ─── Invites ───────────────────────────────────────────────────────────────

  async inviteMember(
    householdId: string,
    ownerUserId: string,
    email: string,
    role: "member" | "admin" = "member",
    ctx?: ActorCtx
  ) {
    const callerMembership = await prisma.householdMember.findUnique({
      where: { householdId_userId: { householdId, userId: ownerUserId } },
    });
    if (!callerMembership) throw new AuthorizationError("Not a member of this household");
    assertOwnerOrAdmin(callerMembership.role);

    const household = await prisma.household.findUnique({ where: { id: householdId } });
    if (!household) throw new NotFoundError("Household not found");

    const normalizedEmail = normalizeEmail(email)!;

    const existingMember = await prisma.householdMember.findFirst({
      where: {
        householdId,
        user: { email: normalizedEmail },
      },
    });

    if (existingMember) {
      throw new ConflictError("A user with this email is already a member of this household");
    }

    const existingInvite = await prisma.householdInvite.findFirst({
      where: {
        householdId,
        email: normalizedEmail,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      throw new ConflictError("An active invite already exists for this email");
    }

    const rawToken = generateInviteToken();
    const tokenHash = hashInviteToken(rawToken);
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_MS);

    if (ctx) {
      await audited({
        db: prisma,
        ctx,
        action: "INVITE_MEMBER",
        resource: "household-invite",
        resourceId: tokenHash,
        beforeFetch: async () => null,
        mutation: async (tx) =>
          tx.householdInvite.create({
            data: {
              householdId,
              email: normalizedEmail,
              tokenHash,
              expiresAt,
              createdByUserId: ownerUserId,
              intendedRole: role,
            },
          }),
      });
    } else {
      await prisma.householdInvite.create({
        data: {
          householdId,
          email: normalizedEmail,
          tokenHash,
          expiresAt,
          createdByUserId: ownerUserId,
          intendedRole: role,
        },
      });
    }

    return { token: rawToken, email: normalizedEmail };
  },

  async cancelInvite(householdId: string, ownerUserId: string, inviteId: string) {
    await assertOwner(householdId, ownerUserId);

    const invite = await prisma.householdInvite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.householdId !== householdId) throw new NotFoundError("Invite not found");

    await prisma.householdInvite.delete({ where: { id: inviteId } });
  },

  // ─── Invite acceptance ─────────────────────────────────────────────────────

  async validateInviteToken(token: string) {
    const tokenHash = hashInviteToken(token);
    const invite = await prisma.householdInvite.findUnique({
      where: { tokenHash },
      include: { household: { select: { id: true, name: true } } },
    });

    if (!invite) throw new NotFoundError("Invalid invitation link");
    if (invite.usedAt) throw new ValidationError("This invitation has already been used");
    if (invite.expiresAt < new Date()) throw new ValidationError("This invitation has expired");

    return invite;
  },

  /** New user accepts an invite — creates account + joins household */
  async acceptInvite(token: string, newUser: { name: string; email: string; password: string }) {
    const invite = await this.validateInviteToken(token);
    const normalizedEmail = normalizeEmail(newUser.email);

    // Validate password (mirrors authService rules)
    if (newUser.password.length < 12) {
      throw new ValidationError("Password must be at least 12 characters long");
    }

    if (normalizedEmail !== invite.email) {
      throw new ValidationError("This invite must be used with the invited email address");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail! },
    });
    if (existingUser) {
      throw new ConflictError(
        "An account with this email already exists. Please log in and use the join link instead."
      );
    }

    const passwordHash = await hashPassword(newUser.password);

    // Create user + personal household in a transaction
    const { user, personalHouseholdId } = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: normalizedEmail!,
          passwordHash,
          name: newUser.name,
          preferences: {
            currency: "GBP",
            dateFormat: "DD/MM/YYYY",
            theme: "dark",
            defaultInflationRate: 2.5,
          },
        },
      });

      // Personal household
      const personal = await tx.household.create({
        data: {
          name: `${newUser.name}'s Household`,
          members: { create: { userId: created.id, role: "owner" } },
        },
      });
      await tx.householdSettings.create({ data: { householdId: personal.id } });

      // Join the invited household and set it as active
      await tx.householdMember.create({
        data: {
          householdId: invite.householdId,
          userId: created.id,
          role: invite.intendedRole ?? "member",
        },
      });

      const updated = await tx.user.update({
        where: { id: created.id },
        data: { activeHouseholdId: invite.householdId },
      });

      // Mark invite used
      await tx.householdInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });

      return { user: updated, personalHouseholdId: personal.id };
    });

    await subcategoryService.seedDefaults(personalHouseholdId);

    // Generate auth tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id });
    const now = new Date();
    const familyId = generateTokenFamily();

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        familyId,
        expiresAt: new Date(now.getTime() + IDLE_SESSION_MS),
        sessionExpiresAt: new Date(now.getTime() + ABSOLUTE_SESSION_MS),
        rememberMe: false,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  },

  /** Existing logged-in user joins a household via invite */
  async joinViaInvite(token: string, existingUserId: string) {
    const invite = await this.validateInviteToken(token);

    const user = await prisma.user.findUnique({ where: { id: existingUserId } });
    if (!user) throw new NotFoundError("User not found");

    if (normalizeEmail(user.email) !== invite.email) {
      throw new ValidationError(
        "This invite is for a different email address. Please sign in with the invited account."
      );
    }

    const existing = await prisma.householdMember.findUnique({
      where: { householdId_userId: { householdId: invite.householdId, userId: existingUserId } },
    });
    if (existing) throw new ConflictError("You are already a member of this household");

    await prisma.$transaction([
      prisma.householdMember.create({
        data: {
          householdId: invite.householdId,
          userId: existingUserId,
          role: invite.intendedRole ?? "member",
        },
      }),
      prisma.user.update({
        where: { id: existingUserId },
        data: { activeHouseholdId: invite.householdId },
      }),
      prisma.householdInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return invite.household;
  },
};
