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
