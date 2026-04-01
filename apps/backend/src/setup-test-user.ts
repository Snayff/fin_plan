import { prisma } from "./config/database";

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: "owner@finplan.test" } });
  if (existing) {
    await prisma.householdMember.deleteMany({ where: { userId: existing.id } });
    await prisma.user.update({ where: { id: existing.id }, data: { activeHouseholdId: null } });
    await prisma.household.deleteMany({ where: { name: "Browser Test Household" } });
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const hash = await Bun.password.hash("BrowserTest123!", { algorithm: "bcrypt", cost: 12 });
  const household = await prisma.household.create({ data: { name: "Browser Test Household" } });
  const user = await prisma.user.create({
    data: {
      email: "owner@finplan.test",
      name: "Test Owner",
      passwordHash: hash,
      activeHouseholdId: household.id,
    },
  });
  await prisma.householdMember.create({
    data: { householdId: household.id, userId: user.id, role: "owner" },
  });
  console.log("Setup complete:", user.email, "| household:", household.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
