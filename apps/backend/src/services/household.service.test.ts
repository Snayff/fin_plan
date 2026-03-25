import { describe, it, expect, mock, beforeEach } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";
import {
  buildUser,
  buildHousehold,
  buildHouseholdMember,
  buildHouseholdInvite,
} from "../test/fixtures";

mock.module("../config/database", () => ({
  prisma: prismaMock,
}));

// JWT utils used by acceptInvite
mock.module("../utils/jwt", () => ({
  generateAccessToken: mock(() => "access-token"),
  generateRefreshToken: mock(() => "refresh-token"),
  hashToken: mock(() => "hashed-token"),
  generateTokenFamily: mock(() => "family-id"),
}));

// Password utils used by acceptInvite
mock.module("../utils/password", () => ({
  hashPassword: mock(() => Promise.resolve("hashed-password")),
}));

import { householdService } from "./household.service";
import { AuthorizationError, ConflictError, NotFoundError, ValidationError } from "../utils/errors";

beforeEach(() => {
  resetPrismaMocks();
});

// ─── createHousehold ────────────────────────────────────────────────────────

describe("householdService.createHousehold", () => {
  it("creates a household with the given name and owner membership", async () => {
    const user = buildUser();
    const household = buildHousehold({ name: "My Household" });
    prismaMock.household.create.mockResolvedValue(household);

    const result = await householdService.createHousehold(user.id, "My Household");

    expect(prismaMock.household.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "My Household",
          members: { create: { userId: user.id, role: "owner" } },
        }),
      })
    );
    expect(result.id).toBe(household.id);
    expect(result.name).toBe("My Household");
  });
});

// ─── getUserHouseholds ──────────────────────────────────────────────────────

describe("householdService.getUserHouseholds", () => {
  it("returns household memberships for the user", async () => {
    const user = buildUser();
    const household = buildHousehold();
    const member = buildHouseholdMember({
      userId: user.id,
      householdId: household.id,
      household: { ...household, _count: { members: 1 } },
    });
    prismaMock.householdMember.findMany.mockResolvedValue([member]);

    const result = await householdService.getUserHouseholds(user.id);

    expect(prismaMock.householdMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: expect.any(String) },
        include: {
          household: expect.objectContaining({
            include: expect.objectContaining({
              _count: expect.any(Object),
            }),
          }),
        },
        orderBy: { joinedAt: "asc" },
      })
    );
    expect(result).toHaveLength(1);
    expect(result[0].householdId).toBe(household.id);
  });

  it("returns empty array when user has no memberships", async () => {
    prismaMock.householdMember.findMany.mockResolvedValue([]);
    const result = await householdService.getUserHouseholds("user-no-households");
    expect(result).toEqual([]);
  });
});

// ─── switchHousehold ─────────────────────────────────────────────────────────

describe("householdService.switchHousehold", () => {
  it("updates the user's activeHouseholdId when user is a member", async () => {
    const user = buildUser();
    const household = buildHousehold();
    const member = buildHouseholdMember({ householdId: household.id, userId: user.id });
    prismaMock.householdMember.findUnique.mockResolvedValue(member);
    prismaMock.user.update.mockResolvedValue({ ...user, activeHouseholdId: household.id });

    await householdService.switchHousehold(user.id, household.id);

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: user.id },
        data: { activeHouseholdId: household.id },
      })
    );
  });

  it("throws AuthorizationError when user is not a member", async () => {
    prismaMock.householdMember.findUnique.mockResolvedValue(null);
    await expect(householdService.switchHousehold("user-1", "household-1")).rejects.toThrow(
      AuthorizationError
    );
  });
});

// ─── getHouseholdDetails ─────────────────────────────────────────────────────

describe("householdService.getHouseholdDetails", () => {
  it("returns household with members and active invites when requester is a member", async () => {
    const user = buildUser();
    const household = buildHousehold();
    const member = buildHouseholdMember({ householdId: household.id, userId: user.id });
    const householdWithDetails = {
      ...household,
      members: [{ ...member, user: { id: user.id, name: user.name, email: user.email } }],
      invites: [],
    };
    prismaMock.householdMember.findUnique.mockResolvedValue(member);
    prismaMock.household.findUnique.mockResolvedValue(householdWithDetails);

    const result = await householdService.getHouseholdDetails(household.id, user.id);

    expect(prismaMock.household.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: household.id } })
    );
    expect(result).not.toBeNull();
    expect(result!.members).toHaveLength(1);
  });

  it("throws AuthorizationError when requester is not a member", async () => {
    prismaMock.householdMember.findUnique.mockResolvedValue(null);
    await expect(
      householdService.getHouseholdDetails("household-1", "outsider-user")
    ).rejects.toThrow(AuthorizationError);
  });
});

// ─── renameHousehold ─────────────────────────────────────────────────────────

describe("householdService.renameHousehold", () => {
  it("updates the household name when caller is the owner", async () => {
    const owner = buildUser();
    const household = buildHousehold();
    const ownerMember = buildHouseholdMember({
      householdId: household.id,
      userId: owner.id,
      role: "owner",
    });
    const updated = { ...household, name: "New Name" };
    prismaMock.householdMember.findUnique.mockResolvedValue(ownerMember);
    prismaMock.household.update.mockResolvedValue(updated);

    const result = await householdService.renameHousehold(household.id, owner.id, "New Name");

    expect(prismaMock.household.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: household.id },
        data: { name: "New Name" },
      })
    );
    expect(result.name).toBe("New Name");
  });

  it("throws AuthorizationError when caller is not an owner", async () => {
    const nonOwnerMember = buildHouseholdMember({ role: "member" });
    prismaMock.householdMember.findUnique.mockResolvedValue(nonOwnerMember);
    await expect(
      householdService.renameHousehold("household-1", "member-user", "New Name")
    ).rejects.toThrow(AuthorizationError);
  });

  it("throws AuthorizationError when caller is not a member", async () => {
    prismaMock.householdMember.findUnique.mockResolvedValue(null);
    await expect(
      householdService.renameHousehold("household-1", "outsider", "New Name")
    ).rejects.toThrow(AuthorizationError);
  });
});

// ─── removeMember ────────────────────────────────────────────────────────────

describe("householdService.removeMember", () => {
  it("deletes the target member when caller is the owner", async () => {
    const owner = buildUser();
    const target = buildUser();
    const ownerMember = buildHouseholdMember({
      householdId: "household-1",
      userId: owner.id,
      role: "owner",
    });
    prismaMock.householdMember.findUnique.mockResolvedValue(ownerMember);
    prismaMock.householdMember.delete.mockResolvedValue(ownerMember);

    await householdService.removeMember("household-1", owner.id, target.id);

    expect(prismaMock.householdMember.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { householdId_userId: { householdId: "household-1", userId: target.id } },
      })
    );
  });

  it("throws ValidationError when owner tries to remove themselves", async () => {
    const owner = buildUser();
    const ownerMember = buildHouseholdMember({
      householdId: "household-1",
      userId: owner.id,
      role: "owner",
    });
    prismaMock.householdMember.findUnique.mockResolvedValue(ownerMember);

    await expect(householdService.removeMember("household-1", owner.id, owner.id)).rejects.toThrow(
      ValidationError
    );
  });

  it("throws AuthorizationError when caller is not the owner", async () => {
    const nonOwnerMember = buildHouseholdMember({ role: "member" });
    prismaMock.householdMember.findUnique.mockResolvedValue(nonOwnerMember);

    await expect(
      householdService.removeMember("household-1", "member-user", "target-user")
    ).rejects.toThrow(AuthorizationError);
  });

  it("throws AuthorizationError when caller is not a member", async () => {
    prismaMock.householdMember.findUnique.mockResolvedValue(null);

    await expect(
      householdService.removeMember("household-1", "outsider", "target-user")
    ).rejects.toThrow(AuthorizationError);
  });
});

// ─── validateInviteToken ──────────────────────────────────────────────────────

describe("householdService.validateInviteToken", () => {
  it("returns invite when token is valid", async () => {
    const invite = buildHouseholdInvite({
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      household: { id: "household-1", name: "Test Household" },
    });
    prismaMock.householdInvite.findUnique.mockResolvedValue(invite);

    const result = await householdService.validateInviteToken("valid-raw-token");

    expect(prismaMock.householdInvite.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tokenHash: expect.any(String) },
      })
    );
    expect(result.id).toBe(invite.id);
  });

  it("throws NotFoundError when invite does not exist", async () => {
    prismaMock.householdInvite.findUnique.mockResolvedValue(null);
    await expect(householdService.validateInviteToken("bad-token")).rejects.toThrow(NotFoundError);
  });

  it("throws ValidationError when invite has already been used", async () => {
    const usedInvite = buildHouseholdInvite({
      usedAt: new Date("2025-01-01T06:00:00Z"),
      expiresAt: new Date(Date.now() + 60_000),
      household: { id: "household-1", name: "Test Household" },
    });
    prismaMock.householdInvite.findUnique.mockResolvedValue(usedInvite);
    await expect(householdService.validateInviteToken("used-token")).rejects.toThrow(
      ValidationError
    );
  });

  it("throws ValidationError when invite has expired", async () => {
    const expiredInvite = buildHouseholdInvite({
      usedAt: null,
      expiresAt: new Date("2020-01-01T00:00:00Z"),
      household: { id: "household-1", name: "Test Household" },
    });
    prismaMock.householdInvite.findUnique.mockResolvedValue(expiredInvite);
    await expect(householdService.validateInviteToken("expired-token")).rejects.toThrow(
      ValidationError
    );
  });
});

describe("householdService.inviteMember", () => {
  it("stores normalized invite email when provided", async () => {
    const owner = buildUser();
    const household = buildHousehold();
    const ownerMember = buildHouseholdMember({
      householdId: household.id,
      userId: owner.id,
      role: "owner",
    });

    prismaMock.householdMember.findUnique.mockResolvedValue(ownerMember);
    prismaMock.household.findUnique.mockResolvedValue(household);
    prismaMock.householdMember.findFirst.mockResolvedValue(null);
    prismaMock.householdInvite.findFirst.mockResolvedValue(null);
    prismaMock.householdInvite.create.mockResolvedValue(
      buildHouseholdInvite({ email: "invitee@test.com" })
    );

    const result = await householdService.inviteMember(
      household.id,
      owner.id,
      " Invitee@Test.com "
    );

    expect(prismaMock.householdInvite.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          householdId: household.id,
          email: "invitee@test.com",
          createdByUserId: owner.id,
        }),
      })
    );
    expect(result.email).toBe("invitee@test.com");
  });

  it("rejects invite when email already belongs to a household member", async () => {
    const owner = buildUser();
    const household = buildHousehold();
    const ownerMember = buildHouseholdMember({
      householdId: household.id,
      userId: owner.id,
      role: "owner",
    });

    prismaMock.householdMember.findUnique.mockResolvedValue(ownerMember);
    prismaMock.household.findUnique.mockResolvedValue(household);
    prismaMock.householdMember.findFirst.mockResolvedValue(
      buildHouseholdMember({ userId: "member-2" })
    );

    await expect(
      householdService.inviteMember(household.id, owner.id, "member@example.com")
    ).rejects.toThrow(ConflictError);
  });
});

describe("householdService.acceptInvite", () => {
  it("rejects new-user signup when email does not match email-bound invite", async () => {
    const invite = buildHouseholdInvite({
      email: "invitee@example.com",
      household: { id: "household-1", name: "Test Household" },
    });

    prismaMock.householdInvite.findUnique.mockResolvedValue(invite);

    await expect(
      householdService.acceptInvite("valid-token", {
        name: "Alice",
        email: "other@example.com",
        password: "verysecure123",
      })
    ).rejects.toThrow(ValidationError);
  });
});

describe("householdService.joinViaInvite", () => {
  it("rejects existing user when account email does not match email-bound invite", async () => {
    const invite = buildHouseholdInvite({
      email: "invitee@example.com",
      household: { id: "household-1", name: "Test Household" },
    });

    prismaMock.householdInvite.findUnique.mockResolvedValue(invite);
    prismaMock.user.findUnique.mockResolvedValue(
      buildUser({ id: "user-1", email: "wrong@example.com" })
    );

    await expect(householdService.joinViaInvite("valid-token", "user-1")).rejects.toThrow(
      ValidationError
    );
  });
});

describe("householdService.leaveHousehold", () => {
  it("removes a regular member from the household", async () => {
    const member = buildHouseholdMember({
      householdId: "household-1",
      userId: "user-1",
      role: "member",
    });
    const user = buildUser({ id: "user-1", activeHouseholdId: "household-2" });

    prismaMock.householdMember.findUnique.mockResolvedValue(member);
    prismaMock.householdMember.delete.mockResolvedValue(member);
    prismaMock.user.findUnique.mockResolvedValue(user);

    await householdService.leaveHousehold("household-1", "user-1");

    expect(prismaMock.householdMember.delete).toHaveBeenCalledWith({
      where: {
        householdId_userId: { householdId: "household-1", userId: "user-1" },
      },
    });
  });

  it("throws NotFoundError if the user is not a member", async () => {
    prismaMock.householdMember.findUnique.mockResolvedValue(null);

    await expect(householdService.leaveHousehold("household-1", "user-1")).rejects.toThrow(
      NotFoundError
    );
  });

  it("throws ValidationError if the user is the sole owner", async () => {
    const member = buildHouseholdMember({ role: "owner" });
    prismaMock.householdMember.findUnique.mockResolvedValue(member);
    prismaMock.householdMember.count.mockResolvedValue(1);

    await expect(householdService.leaveHousehold("household-1", "user-1")).rejects.toThrow(
      ValidationError
    );
  });

  it("allows an owner to leave when another owner exists", async () => {
    const member = buildHouseholdMember({ role: "owner" });
    const user = buildUser({ id: "user-1", activeHouseholdId: "household-2" });
    prismaMock.householdMember.findUnique.mockResolvedValue(member);
    prismaMock.householdMember.count.mockResolvedValue(2);
    prismaMock.householdMember.delete.mockResolvedValue(member);
    prismaMock.user.findUnique.mockResolvedValue(user);

    await householdService.leaveHousehold("household-1", "user-1");

    expect(prismaMock.householdMember.delete).toHaveBeenCalled();
  });

  it("switches activeHouseholdId when leaving the currently active household", async () => {
    const member = buildHouseholdMember({
      householdId: "household-1",
      userId: "user-1",
      role: "member",
    });
    const user = buildUser({ id: "user-1", activeHouseholdId: "household-1" });
    const otherMembership = buildHouseholdMember({
      householdId: "household-2",
      userId: "user-1",
    });

    prismaMock.householdMember.findUnique.mockResolvedValue(member);
    prismaMock.householdMember.delete.mockResolvedValue(member);
    prismaMock.user.findUnique.mockResolvedValue(user);
    prismaMock.householdMember.findFirst.mockResolvedValue(otherMembership);
    prismaMock.user.update.mockResolvedValue({
      ...user,
      activeHouseholdId: "household-2",
    });

    await householdService.leaveHousehold("household-1", "user-1");

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { activeHouseholdId: "household-2" },
    });
  });

  it("does not update activeHouseholdId when leaving a non-active household", async () => {
    const member = buildHouseholdMember({
      householdId: "household-1",
      userId: "user-1",
      role: "member",
    });
    const user = buildUser({ id: "user-1", activeHouseholdId: "household-2" });

    prismaMock.householdMember.findUnique.mockResolvedValue(member);
    prismaMock.householdMember.delete.mockResolvedValue(member);
    prismaMock.user.findUnique.mockResolvedValue(user);

    await householdService.leaveHousehold("household-1", "user-1");

    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
