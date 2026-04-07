import { FastifyInstance } from "fastify";
import {
  householdService,
  updateMemberRole,
  assertOwnerOrAdmin,
} from "../services/household.service";
import { authMiddleware } from "../middleware/auth.middleware";
import { prisma } from "../config/database.js";
import { memberService } from "../services/member.service.js";
import {
  createHouseholdSchema,
  createHouseholdInviteSchema,
  renameHouseholdSchema,
  updateMemberRoleSchema,
  updateMemberProfileSchema,
  createMemberSchema,
  updateMemberSchema,
  deleteMemberSchema,
} from "@finplan/shared";
import { AuthorizationError, NotFoundError } from "../utils/errors.js";
import { actorCtx } from "../lib/actor-ctx.js";
import { audited } from "../services/audit.service.js";

export async function householdRoutes(fastify: FastifyInstance) {
  // List all households the current user belongs to
  fastify.get("/households", { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const memberships = await householdService.getUserHouseholds(userId);
    return reply.send({ households: memberships });
  });

  // Create a new household
  fastify.post("/households", { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { name } = createHouseholdSchema.parse(request.body);
    const household = await householdService.createHousehold(userId, name);
    return reply.status(201).send({ household });
  });

  // Switch active household
  fastify.post(
    "/households/:id/switch",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      await householdService.switchHousehold(userId, id);
      return reply.send({ success: true });
    }
  );

  // Get household details (members + pending invites)
  fastify.get("/households/:id", { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };
    const household = await householdService.getHouseholdDetails(id, userId);
    return reply.send({ household });
  });

  // Rename household (owner only)
  fastify.patch("/households/:id", { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };
    const { name } = renameHouseholdSchema.parse(request.body);
    const household = await householdService.renameHousehold(id, userId, name);
    return reply.send({ household });
  });

  // Invite a member (owner only) — rate limited: 5 invites per hour per household
  fastify.post(
    "/households/:id/invite",
    {
      preHandler: [authMiddleware],
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 hour",
          keyGenerator: (req) => {
            const { id } = req.params as { id: string };
            return `invite_${id}`;
          },
        },
      },
    },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      const { email, role } = createHouseholdInviteSchema.parse(request.body ?? {});
      const { token, email: invitedEmail } = await householdService.inviteMember(
        id,
        userId,
        email,
        role,
        actorCtx(request)
      );
      return reply.status(201).send({ token, invitedEmail });
    }
  );

  // Remove a member (owner only)
  fastify.delete(
    "/households/:id/members/:memberId",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { id, memberId } = request.params as { id: string; memberId: string };
      await householdService.removeMember(id, userId, memberId, actorCtx(request));
      return reply.send({ success: true });
    }
  );

  // Cancel a pending invite (owner only)
  fastify.delete(
    "/households/:id/invites/:inviteId",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { id, inviteId } = request.params as { id: string; inviteId: string };
      await householdService.cancelInvite(id, userId, inviteId);
      return reply.send({ success: true });
    }
  );

  // Leave household (self-removal)
  fastify.delete(
    "/households/:id/leave",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      await householdService.leaveHousehold(id, userId);
      return reply.send({ success: true });
    }
  );

  // Update a member's profile (self, or owner/admin)
  fastify.patch(
    "/households/:householdId/members/:userId/profile",
    { preHandler: [authMiddleware] },
    async (req, reply) => {
      const { householdId, userId } = req.params as { householdId: string; userId: string };
      if (householdId !== req.householdId) {
        throw new AuthorizationError("Forbidden");
      }
      const callerId = req.user!.userId;
      const isSelf = userId === callerId;
      if (!isSelf) {
        const callerMember = await prisma.member.findFirst({
          where: { householdId, userId: callerId },
          select: { role: true },
        });
        assertOwnerOrAdmin(callerMember?.role ?? "member");
      }
      const targetMember = await prisma.member.findFirst({
        where: { householdId, userId },
        select: { id: true },
      });
      if (!targetMember) {
        throw new NotFoundError("Member not found");
      }
      const data = updateMemberProfileSchema.parse(req.body);
      const updated = await audited({
        db: prisma,
        ctx: actorCtx(req),
        action: "UPDATE_MEMBER_PROFILE",
        resource: "household-member",
        resourceId: targetMember.id,
        beforeFetch: async (tx) =>
          tx.member.findUnique({
            where: { id: targetMember.id },
          }) as Promise<Record<string, unknown> | null>,
        mutation: async (tx) =>
          tx.member.update({
            where: { id: targetMember.id },
            data: {
              ...(data.dateOfBirth !== undefined
                ? { dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null }
                : {}),
              ...(data.retirementYear !== undefined ? { retirementYear: data.retirementYear } : {}),
            },
          }),
      });
      return reply.send(updated);
    }
  );

  // Update a member's role (owner/admin only)
  fastify.patch(
    "/households/:householdId/members/:userId/role",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const callerId = request.user!.userId;
      const { householdId, userId: targetUserId } = request.params as {
        householdId: string;
        userId: string;
      };

      // Security: caller must belong to the active household matching the route param
      if (householdId !== request.householdId) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const { role: newRole } = updateMemberRoleSchema.parse(request.body);

      try {
        const updated = await updateMemberRole(
          prisma,
          { householdId, callerId, targetUserId, newRole },
          actorCtx(request)
        );
        return reply.send({ member: updated });
      } catch (err) {
        if (err instanceof AuthorizationError) {
          return reply.status(403).send({ error: err.message });
        }
        if (err instanceof NotFoundError) {
          return reply.status(404).send({ error: err.message });
        }
        throw err;
      }
    }
  );

  // List member profiles for a household
  fastify.get(
    "/households/:id/member-profiles",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const members = await memberService.listMembers(id);
      return reply.send({ members });
    }
  );

  // Create a new member profile (owner only)
  fastify.post(
    "/households/:id/member-profiles",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      const data = createMemberSchema.parse(request.body);
      const member = await memberService.createMember(id, userId, data);
      return reply.status(201).send({ member });
    }
  );

  // Update a member profile (owner only)
  fastify.patch(
    "/households/:id/member-profiles/:memberId",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { id, memberId } = request.params as { id: string; memberId: string };
      const data = updateMemberSchema.parse(request.body);
      const member = await memberService.updateMember(id, userId, memberId, data);
      return reply.send({ member });
    }
  );

  // Delete a member profile (owner only, with optional reassignment)
  fastify.delete(
    "/households/:id/member-profiles/:memberId",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { id, memberId } = request.params as { id: string; memberId: string };
      const { reassignToMemberId } = deleteMemberSchema.parse(request.body ?? {});
      await memberService.deleteMember(id, userId, memberId, reassignToMemberId);
      return reply.send({ success: true });
    }
  );
}
