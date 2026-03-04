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

mock.module("./email.service", () => ({
  sendInviteEmail: mock(() => Promise.resolve()),
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
    await expect(
      householdService.switchHousehold("user-1", "household-1")
    ).rejects.toThrow(AuthorizationError);
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

    await expect(
      householdService.removeMember("household-1", owner.id, owner.id)
    ).rejects.toThrow(ValidationError);
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
    await expect(
      householdService.validateInviteToken("bad-token")
    ).rejects.toThrow(NotFoundError);
  });

  it("throws ValidationError when invite has already been used", async () => {
    const usedInvite = buildHouseholdInvite({
      usedAt: new Date("2025-01-01T06:00:00Z"),
      expiresAt: new Date(Date.now() + 60_000),
      household: { id: "household-1", name: "Test Household" },
    });
    prismaMock.householdInvite.findUnique.mockResolvedValue(usedInvite);
    await expect(
      householdService.validateInviteToken("used-token")
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when invite has expired", async () => {
    const expiredInvite = buildHouseholdInvite({
      usedAt: null,
      expiresAt: new Date("2020-01-01T00:00:00Z"),
      household: { id: "household-1", name: "Test Household" },
    });
    prismaMock.householdInvite.findUnique.mockResolvedValue(expiredInvite);
    await expect(
      householdService.validateInviteToken("expired-token")
    ).rejects.toThrow(ValidationError);
  });
});
