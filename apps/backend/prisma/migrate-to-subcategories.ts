import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_SUBCATEGORIES = {
  income: [
    { name: "Salary", sortOrder: 0 },
    { name: "Dividends", sortOrder: 1 },
    { name: "Other", sortOrder: 2 },
  ],
  committed: [
    { name: "Housing", sortOrder: 0 },
    { name: "Utilities", sortOrder: 1 },
    { name: "Services", sortOrder: 2 },
    { name: "Other", sortOrder: 3 },
  ],
  discretionary: [
    { name: "Food", sortOrder: 0 },
    { name: "Fun", sortOrder: 1 },
    { name: "Clothes", sortOrder: 2 },
    { name: "Gifts", sortOrder: 3, isLocked: true },
    { name: "Savings", sortOrder: 4 },
    { name: "Other", sortOrder: 5 },
  ],
} as const;

const INCOME_TYPE_TO_SUBCATEGORY: Record<string, string> = {
  salary: "Salary",
  dividends: "Dividends",
  freelance: "Other",
  rental: "Other",
  benefits: "Other",
  other: "Other",
};

async function main() {
  console.log("Starting data migration to subcategory model...");

  // 1. Get all households
  const households = await prisma.household.findMany({ select: { id: true } });
  console.log(`Found ${households.length} households`);

  for (const household of households) {
    const hid = household.id;
    console.log(`\nMigrating household ${hid}...`);

    // 2. Seed subcategories for this household
    const existingCount = await prisma.subcategory.count({ where: { householdId: hid } });
    if (existingCount > 0) {
      console.log(`  Subcategories already exist (${existingCount}), skipping seed`);
    } else {
      const rows: any[] = [];
      for (const [tier, subs] of Object.entries(DEFAULT_SUBCATEGORIES)) {
        for (const sub of subs) {
          rows.push({
            householdId: hid,
            tier,
            name: sub.name,
            sortOrder: sub.sortOrder,
            isLocked: "isLocked" in sub ? sub.isLocked : false,
            isDefault: true,
          });
        }
      }
      await prisma.subcategory.createMany({ data: rows });
      console.log(`  Seeded ${rows.length} subcategories`);
    }

    // Build subcategory lookup
    const subcategories = await prisma.subcategory.findMany({ where: { householdId: hid } });
    const subLookup = new Map<string, string>();
    for (const sub of subcategories) {
      subLookup.set(`${sub.tier}:${sub.name}`, sub.id);
    }

    const getSubId = (tier: string, name: string): string => {
      return subLookup.get(`${tier}:${name}`) ?? subLookup.get(`${tier}:Other`)!;
    };

    // 3. Migrate CommittedBill → CommittedItem (spendType=monthly)
    const bills = await prisma.committedBill.findMany({ where: { householdId: hid } });
    for (const bill of bills) {
      await prisma.committedItem.create({
        data: {
          id: bill.id,
          householdId: hid,
          subcategoryId: getSubId("committed", "Other"),
          name: bill.name,
          amount: bill.amount,
          spendType: "monthly",
          ownerId: bill.ownerId,
          sortOrder: bill.sortOrder,
          lastReviewedAt: bill.lastReviewedAt,
          createdAt: bill.createdAt,
          updatedAt: bill.updatedAt,
        },
      });
    }
    console.log(`  Migrated ${bills.length} committed bills → CommittedItem`);

    // 4. Migrate YearlyBill → CommittedItem (spendType=yearly)
    const yearlyBills = await prisma.yearlyBill.findMany({ where: { householdId: hid } });
    for (const yb of yearlyBills) {
      await prisma.committedItem.create({
        data: {
          id: yb.id,
          householdId: hid,
          subcategoryId: getSubId("committed", "Other"),
          name: yb.name,
          amount: yb.amount,
          spendType: "yearly",
          dueMonth: yb.dueMonth,
          sortOrder: yb.sortOrder,
          lastReviewedAt: yb.lastReviewedAt,
          createdAt: yb.createdAt,
          updatedAt: yb.updatedAt,
        },
      });
    }
    console.log(`  Migrated ${yearlyBills.length} yearly bills → CommittedItem`);

    // 5. Migrate DiscretionaryCategory → DiscretionaryItem
    const cats = await prisma.discretionaryCategory.findMany({ where: { householdId: hid } });
    for (const cat of cats) {
      await prisma.discretionaryItem.create({
        data: {
          id: cat.id,
          householdId: hid,
          subcategoryId: getSubId("discretionary", "Other"),
          name: cat.name,
          amount: cat.monthlyBudget,
          spendType: "monthly",
          sortOrder: cat.sortOrder,
          lastReviewedAt: cat.lastReviewedAt,
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt,
        },
      });
    }
    console.log(`  Migrated ${cats.length} discretionary categories → DiscretionaryItem`);

    // 6. Migrate SavingsAllocation → DiscretionaryItem (in Savings subcategory)
    const savings = await prisma.savingsAllocation.findMany({ where: { householdId: hid } });
    for (const sav of savings) {
      await prisma.discretionaryItem.create({
        data: {
          id: sav.id,
          householdId: hid,
          subcategoryId: getSubId("discretionary", "Savings"),
          name: sav.name,
          amount: sav.monthlyAmount,
          spendType: "monthly",
          wealthAccountId: sav.wealthAccountId,
          sortOrder: sav.sortOrder,
          lastReviewedAt: sav.lastReviewedAt,
          createdAt: sav.createdAt,
          updatedAt: sav.updatedAt,
        },
      });
    }
    console.log(`  Migrated ${savings.length} savings allocations → DiscretionaryItem`);

    // 7. Set subcategoryId on IncomeSource based on incomeType
    const incomeSources = await prisma.incomeSource.findMany({ where: { householdId: hid } });
    for (const src of incomeSources) {
      const subcategoryName = INCOME_TYPE_TO_SUBCATEGORY[src.incomeType] ?? "Other";
      const subcategoryId = getSubId("income", subcategoryName);
      await prisma.incomeSource.update({
        where: { id: src.id },
        data: { subcategoryId },
      });
    }
    console.log(`  Set subcategoryId on ${incomeSources.length} income sources`);
  }

  // 8. Update WaterfallHistory itemType values
  await prisma.$executeRaw`UPDATE "WaterfallHistory" SET "itemType" = 'committed_item' WHERE "itemType" IN ('committed_bill', 'yearly_bill')`;
  await prisma.$executeRaw`UPDATE "WaterfallHistory" SET "itemType" = 'discretionary_item' WHERE "itemType" IN ('discretionary_category', 'savings_allocation')`;
  console.log("\nUpdated WaterfallHistory itemType values");

  console.log("\nData migration complete!");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
