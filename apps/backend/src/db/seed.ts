import { prisma } from "../config/database";
import { hashPassword } from "../utils/password";

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

  // ─── Income Sources ────────────────────────────────────────────────────────

  const incomeData = [
    {
      name: "Alice Salary",
      amount: 3500,
      frequency: "monthly" as const,
      incomeType: "salary" as const,
      ownerId: user.id,
      sortOrder: 0,
    },
    {
      name: "Bob Salary",
      amount: 2800,
      frequency: "monthly" as const,
      incomeType: "salary" as const,
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

  // ─── Committed Bills ──────────────────────────────────────────────────────

  const committedData = [
    { name: "Rent", amount: 1200, sortOrder: 0 },
    { name: "Internet", amount: 45, sortOrder: 1 },
    { name: "Phone", amount: 25, sortOrder: 2 },
  ];

  for (const bill of committedData) {
    const existing = await prisma.committedBill.findFirst({
      where: { householdId: hId, name: bill.name },
    });
    if (!existing) {
      await prisma.committedBill.create({ data: { householdId: hId, ...bill } });
    }
  }

  // ─── Yearly Bills ─────────────────────────────────────────────────────────

  const yearlyData = [
    { name: "Home Insurance", amount: 600, dueMonth: 9, sortOrder: 0 },
    { name: "Car Tax", amount: 180, dueMonth: 3, sortOrder: 1 },
  ];

  for (const bill of yearlyData) {
    const existing = await prisma.yearlyBill.findFirst({
      where: { householdId: hId, name: bill.name },
    });
    if (!existing) {
      await prisma.yearlyBill.create({ data: { householdId: hId, ...bill } });
    }
  }

  // ─── Discretionary Categories ──────────────────────────────────────────────

  const discretionaryData = [
    { name: "Groceries", monthlyBudget: 500, sortOrder: 0 },
    { name: "Dining Out", monthlyBudget: 150, sortOrder: 1 },
    { name: "Entertainment", monthlyBudget: 80, sortOrder: 2 },
  ];

  for (const cat of discretionaryData) {
    const existing = await prisma.discretionaryCategory.findFirst({
      where: { householdId: hId, name: cat.name },
    });
    if (!existing) {
      await prisma.discretionaryCategory.create({ data: { householdId: hId, ...cat } });
    }
  }

  // ─── Savings Allocations ───────────────────────────────────────────────────

  const savingsData = [{ name: "Emergency Fund", monthlyAmount: 200, sortOrder: 0 }];

  for (const sav of savingsData) {
    const existing = await prisma.savingsAllocation.findFirst({
      where: { householdId: hId, name: sav.name },
    });
    if (!existing) {
      await prisma.savingsAllocation.create({ data: { householdId: hId, ...sav } });
    }
  }

  // ─── Wealth Account ────────────────────────────────────────────────────────

  const accountData = [
    {
      name: "Cash ISA",
      assetClass: "savings" as const,
      balance: 15000,
      isISA: true,
      isaYearContribution: 4000,
      ownerId: user.id,
    },
  ];

  for (const acc of accountData) {
    const existing = await prisma.wealthAccount.findFirst({
      where: { householdId: hId, name: acc.name },
    });
    if (!existing) {
      await prisma.wealthAccount.create({ data: { householdId: hId, ...acc } });
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
