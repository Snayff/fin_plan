import { describe, it, expect, mock, beforeEach } from "bun:test";
import { prismaMock, resetPrismaMocks } from "../test/mocks/prisma";
import { buildMember } from "../test/fixtures";

mock.module("../config/database", () => ({ prisma: prismaMock }));

import { memberService } from "./member.service";
import { AuthorizationError } from "../utils/errors";

beforeEach(() => resetPrismaMocks());

describe("memberService.createMember", () => {
  it("creates a member with name and householdId", async () => {
    const member = buildMember({ name: "Alice", userId: null });
    prismaMock.member.findFirst.mockResolvedValue(buildMember({ role: "owner" }));
    prismaMock.member.create.mockResolvedValue(member);

    const result = await memberService.createMember("household-1", "owner-user", { name: "Alice" });

    expect(prismaMock.member.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Alice", householdId: "household-1", userId: null }),
      })
    );
    expect(result.name).toBe("Alice");
  });

  it("rejects if caller is not owner", async () => {
    prismaMock.member.findFirst.mockResolvedValue(buildMember({ role: "member" }));
    await expect(
      memberService.createMember("household-1", "non-owner", { name: "Alice" })
    ).rejects.toThrow(AuthorizationError);
  });
});

describe("memberService.listMembers", () => {
  it("returns all members for the household", async () => {
    const members = [buildMember({ name: "Alice" }), buildMember({ name: "Bob" })];
    prismaMock.member.findMany.mockResolvedValue(members);

    const result = await memberService.listMembers("household-1");
    expect(result).toHaveLength(2);
  });
});

describe("memberService.createMember gifts integration", () => {
  it("creates a matching GiftPerson row with memberId link", async () => {
    prismaMock.member.findFirst.mockResolvedValue({
      id: "owner",
      role: "owner",
      householdId: "hh-1",
    } as any);
    prismaMock.member.create.mockResolvedValue({
      id: "m-new",
      householdId: "hh-1",
      name: "Sis",
    } as any);
    prismaMock.giftPerson.create.mockResolvedValue({} as any);

    await memberService.createMember("hh-1", "owner-user", { name: "Sis" } as any);

    expect(prismaMock.giftPerson.create).toHaveBeenCalledWith({
      data: {
        householdId: "hh-1",
        name: "Sis",
        memberId: "m-new",
      },
    });
  });

  it("does not throw if a GiftPerson with that name already exists (P2002)", async () => {
    prismaMock.member.findFirst.mockResolvedValue({
      id: "owner",
      role: "owner",
      householdId: "hh-1",
    } as any);
    prismaMock.member.create.mockResolvedValue({
      id: "m-new",
      householdId: "hh-1",
      name: "Sis",
    } as any);
    prismaMock.giftPerson.create.mockRejectedValue({ code: "P2002" });

    await expect(
      memberService.createMember("hh-1", "owner-user", { name: "Sis" } as any)
    ).resolves.toBeDefined();
  });
});

describe("memberService.deleteMember gifts integration", () => {
  it("nullifies GiftPerson.memberId before deleting the member", async () => {
    prismaMock.member.findFirst.mockResolvedValue({
      id: "owner",
      role: "owner",
      householdId: "hh-1",
    } as any);
    prismaMock.member.findUnique.mockResolvedValue({
      id: "m-1",
      householdId: "hh-1",
      userId: null,
    } as any);
    prismaMock.incomeSource.count.mockResolvedValue(0);
    prismaMock.committedItem.count.mockResolvedValue(0);
    prismaMock.asset.count.mockResolvedValue(0);
    prismaMock.account.count.mockResolvedValue(0);
    prismaMock.giftPerson.updateMany.mockResolvedValue({ count: 1 } as any);
    prismaMock.member.delete.mockResolvedValue({} as any);

    await memberService.deleteMember("hh-1", "owner-user", "m-1");

    expect(prismaMock.giftPerson.updateMany).toHaveBeenCalledWith({
      where: { householdId: "hh-1", memberId: "m-1" },
      data: { memberId: null },
    });
  });
});

describe("memberService.updateMember", () => {
  it("updates member name", async () => {
    const member = buildMember({ name: "Alice" });
    const updated = { ...member, name: "Alice Smith" };
    prismaMock.member.findFirst.mockResolvedValue(buildMember({ role: "owner" }));
    prismaMock.member.findUnique.mockResolvedValue(member);
    prismaMock.member.update.mockResolvedValue(updated);

    const result = await memberService.updateMember("household-1", "owner-user", member.id, {
      name: "Alice Smith",
    });
    expect(result.name).toBe("Alice Smith");
  });
});
