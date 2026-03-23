import { prisma } from "../config/database";

async function main() {
  console.log("Seed: nothing to seed for renew build");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
