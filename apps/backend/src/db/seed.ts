import { prisma } from "../config/database";
import { hashPassword } from "../utils/password";
import { subcategoryService } from "../services/subcategory.service";

if (process.env.NODE_ENV === "production") {
  console.log("Seed skipped in production");
  process.exit(0);
}

async function main() {
  const email = "owner@finplan.test";
  const password = "BrowserTest123!";

  // ─── User & Household ──────────────────────────────────────────────────────

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      name: "Test Owner",
    },
    update: { passwordHash, name: "Test Owner" },
  });

  const household = await prisma.household.upsert({
    where: { id: user.activeHouseholdId ?? "seed-household" },
    create: {
      name: "Test Household",
      members: {
        create: { userId: user.id, role: "owner" },
      },
    },
    update: {},
  });

  // Update active household
  await prisma.user.update({
    where: { id: user.id },
    data: { activeHouseholdId: household.id },
  });

  const hId = household.id;

  // ─── Household Settings ────────────────────────────────────────────────────

  await prisma.householdSettings.upsert({
    where: { householdId: hId },
    create: { householdId: hId },
    update: {},
  });

  // ─── Subcategories ─────────────────────────────────────────────────────────

  await subcategoryService.seedDefaults(hId);

  const incomeSalaryId = await subcategoryService.getSubcategoryIdByName(hId, "income", "Salary");
  const committedOtherId = await subcategoryService.getSubcategoryIdByName(
    hId,
    "committed",
    "Other"
  );
  const discretionaryFoodId = await subcategoryService.getSubcategoryIdByName(
    hId,
    "discretionary",
    "Food"
  );
  const discretionarySavingsId = await subcategoryService.getSubcategoryIdByName(
    hId,
    "discretionary",
    "Savings"
  );

  if (!incomeSalaryId || !committedOtherId || !discretionaryFoodId || !discretionarySavingsId) {
    throw new Error("Failed to resolve subcategory IDs for seeding");
  }

  // ─── Income Sources ────────────────────────────────────────────────────────

  const incomeData = [
    {
      name: "Alice Salary",
      amount: 3500,
      frequency: "monthly" as const,
      incomeType: "salary" as const,
      subcategoryId: incomeSalaryId,
      ownerId: user.id,
      sortOrder: 0,
    },
    {
      name: "Bob Salary",
      amount: 2800,
      frequency: "monthly" as const,
      incomeType: "salary" as const,
      subcategoryId: incomeSalaryId,
      sortOrder: 1,
    },
  ];

  for (const income of incomeData) {
    const existing = await prisma.incomeSource.findFirst({
      where: { householdId: hId, name: income.name },
    });
    if (!existing) {
      await prisma.incomeSource.create({ data: { householdId: hId, ...income } });
    }
  }

  // ─── Committed Items (monthly) ─────────────────────────────────────────────

  const committedData = [
    { name: "Rent", amount: 1200, spendType: "monthly" as const, sortOrder: 0 },
    { name: "Internet", amount: 45, spendType: "monthly" as const, sortOrder: 1 },
    { name: "Phone", amount: 25, spendType: "monthly" as const, sortOrder: 2 },
  ];

  for (const item of committedData) {
    const existing = await prisma.committedItem.findFirst({
      where: { householdId: hId, name: item.name },
    });
    if (!existing) {
      await prisma.committedItem.create({
        data: { householdId: hId, subcategoryId: committedOtherId, ...item },
      });
    }
  }

  // ─── Committed Items (yearly) ──────────────────────────────────────────────

  const yearlyData = [
    {
      name: "Home Insurance",
      amount: 600,
      spendType: "yearly" as const,
      dueMonth: 9,
      sortOrder: 0,
    },
    { name: "Car Tax", amount: 180, spendType: "yearly" as const, dueMonth: 3, sortOrder: 1 },
  ];

  for (const item of yearlyData) {
    const existing = await prisma.committedItem.findFirst({
      where: { householdId: hId, name: item.name },
    });
    if (!existing) {
      await prisma.committedItem.create({
        data: { householdId: hId, subcategoryId: committedOtherId, ...item },
      });
    }
  }

  // ─── Discretionary Items ───────────────────────────────────────────────────

  const discretionaryData = [
    { name: "Groceries", amount: 500, spendType: "monthly" as const, sortOrder: 0 },
    { name: "Dining Out", amount: 150, spendType: "monthly" as const, sortOrder: 1 },
    { name: "Entertainment", amount: 80, spendType: "monthly" as const, sortOrder: 2 },
  ];

  for (const item of discretionaryData) {
    const existing = await prisma.discretionaryItem.findFirst({
      where: { householdId: hId, name: item.name },
    });
    if (!existing) {
      await prisma.discretionaryItem.create({
        data: { householdId: hId, subcategoryId: discretionaryFoodId, ...item },
      });
    }
  }

  // ─── Savings Allocations ───────────────────────────────────────────────────

  const savingsData = [
    { name: "Emergency Fund", amount: 200, spendType: "monthly" as const, sortOrder: 0 },
  ];

  for (const item of savingsData) {
    const existing = await prisma.discretionaryItem.findFirst({
      where: { householdId: hId, name: item.name },
    });
    if (!existing) {
      await prisma.discretionaryItem.create({
        data: { householdId: hId, subcategoryId: discretionarySavingsId, ...item },
      });
    }
  }

  console.log(`Seed complete: user=${email}, household=${household.name} (${hId})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
