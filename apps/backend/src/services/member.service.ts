import { prisma } from "../config/database.js";
import { AuthorizationError, NotFoundError, ValidationError } from "../utils/errors.js";
import type { CreateMemberInput, UpdateMemberInput } from "@finplan/shared";

async function assertCallerIsOwner(householdId: string, userId: string) {
  const caller = await prisma.member.findFirst({
    where: { householdId, userId },
  });
  if (!caller || caller.role !== "owner") {
    throw new AuthorizationError("Only household owners can manage members");
  }
  return caller;
}

export const memberService = {
  async createMember(householdId: string, callerUserId: string, data: CreateMemberInput) {
    await assertCallerIsOwner(householdId, callerUserId);

    return prisma.member.create({
      data: {
        householdId,
        userId: null,
        name: data.name,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        retirementYear: data.retirementYear ?? null,
        role: "member",
      },
    });
  },

  async listMembers(householdId: string) {
    return prisma.member.findMany({
      where: { householdId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { joinedAt: "asc" },
    });
  },

  async updateMember(
    householdId: string,
    callerUserId: string,
    memberId: string,
    data: UpdateMemberInput
  ) {
    await assertCallerIsOwner(householdId, callerUserId);

    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member || member.householdId !== householdId) {
      throw new NotFoundError("Member not found");
    }

    return prisma.member.update({
      where: { id: memberId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.dateOfBirth !== undefined
          ? { dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null }
          : {}),
        ...(data.retirementYear !== undefined ? { retirementYear: data.retirementYear } : {}),
      },
    });
  },

  async deleteMember(
    householdId: string,
    callerUserId: string,
    memberId: string,
    reassignToMemberId?: string
  ) {
    await assertCallerIsOwner(householdId, callerUserId);

    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member || member.householdId !== householdId) {
      throw new NotFoundError("Member not found");
    }
    if (member.userId) {
      throw new ValidationError(
        "Cannot delete a member with a linked user account. Use 'Remove member' instead."
      );
    }

    // Check if member has assigned items
    const [incomeCount, committedCount, assetCount, accountCount] = await Promise.all([
      prisma.incomeSource.count({ where: { householdId, ownerId: memberId } }),
      prisma.committedItem.count({ where: { householdId, ownerId: memberId } }),
      prisma.asset.count({ where: { householdId, memberId: memberId } }),
      prisma.account.count({ where: { householdId, memberId: memberId } }),
    ]);

    const totalItems = incomeCount + committedCount + assetCount + accountCount;

    if (totalItems > 0 && !reassignToMemberId) {
      throw new ValidationError(
        `Member has ${totalItems} assigned items. Provide a reassignment target.`
      );
    }

    await prisma.$transaction(async (tx) => {
      if (reassignToMemberId && totalItems > 0) {
        // Verify reassignment target exists
        const target = await tx.member.findUnique({ where: { id: reassignToMemberId } });
        if (!target || target.householdId !== householdId) {
          throw new NotFoundError("Reassignment target member not found");
        }

        await Promise.all([
          tx.incomeSource.updateMany({
            where: { householdId, ownerId: memberId },
            data: { ownerId: reassignToMemberId },
          }),
          tx.committedItem.updateMany({
            where: { householdId, ownerId: memberId },
            data: { ownerId: reassignToMemberId },
          }),
          tx.asset.updateMany({
            where: { householdId, memberId: memberId },
            data: { memberId: reassignToMemberId },
          }),
          tx.account.updateMany({
            where: { householdId, memberId: memberId },
            data: { memberId: reassignToMemberId },
          }),
        ]);
      }

      await tx.member.delete({ where: { id: memberId } });
    });
  },

  async getItemCountsForMember(householdId: string, memberId: string) {
    const [income, committed, assets, accounts] = await Promise.all([
      prisma.incomeSource.count({ where: { householdId, ownerId: memberId } }),
      prisma.committedItem.count({ where: { householdId, ownerId: memberId } }),
      prisma.asset.count({ where: { householdId, memberId: memberId } }),
      prisma.account.count({ where: { householdId, memberId: memberId } }),
    ]);
    return { total: income + committed + assets + accounts, income, committed, assets, accounts };
  },
};
