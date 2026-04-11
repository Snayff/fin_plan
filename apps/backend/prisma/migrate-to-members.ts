// apps/backend/prisma/migrate-to-members.ts
// SUPERSEDED: This script's work is now handled by the squashed SQL migration
// at prisma/migrations/20260407000000_member_model_migration/migration.sql.
// That migration copies household_members → members and rewrites ownerId /
// memberId references in pure SQL, so no TS script is needed for deployment.
// This file is kept for historical reference only.
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existingMembers = await prisma.householdMember.findMany({
    include: { user: { select: { id: true, name: true } } },
  });

  console.log(`Found ${existingMembers.length} HouseholdMember rows to migrate`);

  for (const hm of existingMembers) {
    const existing = await prisma.member.findFirst({
      where: { householdId: hm.householdId, userId: hm.userId },
    });
    if (existing) {
      console.log(`  Skipping ${hm.userId} in ${hm.householdId} — already migrated`);
      continue;
    }

    await prisma.member.create({
      data: {
        householdId: hm.householdId,
        userId: hm.userId,
        name: hm.user.name,
        role: hm.role,
        dateOfBirth: hm.dateOfBirth,
        retirementYear: hm.retirementYear,
        joinedAt: hm.joinedAt,
      },
    });
    console.log(`  Migrated ${hm.user.name} (${hm.userId}) in ${hm.householdId}`);
  }

  // Update ownerId on waterfall items: currently stores userId, needs memberId
  const members = await prisma.member.findMany({
    where: { userId: { not: null } },
    select: { id: true, userId: true, householdId: true },
  });

  const memberByHouseholdUser = new Map<string, string>();
  for (const m of members) {
    memberByHouseholdUser.set(`${m.householdId}:${m.userId}`, m.id);
  }

  // Migrate IncomeSource.ownerId
  const incomeSources = await prisma.incomeSource.findMany({
    where: { ownerId: { not: null } },
    select: { id: true, householdId: true, ownerId: true },
  });
  for (const item of incomeSources) {
    const memberId = memberByHouseholdUser.get(`${item.householdId}:${item.ownerId}`);
    if (memberId) {
      await prisma.incomeSource.update({ where: { id: item.id }, data: { ownerId: memberId } });
    }
  }

  // Migrate CommittedItem.ownerId
  const committedItems = await prisma.committedItem.findMany({
    where: { ownerId: { not: null } },
    select: { id: true, householdId: true, ownerId: true },
  });
  for (const item of committedItems) {
    const memberId = memberByHouseholdUser.get(`${item.householdId}:${item.ownerId}`);
    if (memberId) {
      await prisma.committedItem.update({ where: { id: item.id }, data: { ownerId: memberId } });
    }
  }

  // Migrate Asset.memberUserId
  const assets = await prisma.asset.findMany({
    where: { memberUserId: { not: null } },
    select: { id: true, householdId: true, memberUserId: true },
  });
  for (const item of assets) {
    const memberId = memberByHouseholdUser.get(`${item.householdId}:${item.memberUserId}`);
    if (memberId) {
      await prisma.asset.update({ where: { id: item.id }, data: { memberUserId: memberId } });
    }
  }

  // Migrate Account.memberUserId
  const accounts = await prisma.account.findMany({
    where: { memberUserId: { not: null } },
    select: { id: true, householdId: true, memberUserId: true },
  });
  for (const item of accounts) {
    const memberId = memberByHouseholdUser.get(`${item.householdId}:${item.memberUserId}`);
    if (memberId) {
      await prisma.account.update({ where: { id: item.id }, data: { memberUserId: memberId } });
    }
  }

  console.log("Migration complete");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
