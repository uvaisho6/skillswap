import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = [
    "Cooking",
    "Tutoring",
    "Fitness",
    "Design",
    "DIY",
    "Language",
    "Music",
  ];

  for (const category of categories) {
    // In a real application, you would create categories in the database.
    // For this example, we are just printing them to the console.
    console.log(`Seeding category: ${category}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });