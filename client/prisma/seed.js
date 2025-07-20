import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create a default branch if it doesn't exist
  const defaultBranch = await prisma.branch.upsert({
    where: { email: "main@branch.com" },
    update: {},
    create: {
      name: "Main Branch",
      address: "123 Kulpi Road",
      city: "Baruipur",
      state: "West Bengal",
      pincode: "700144",
      country: "India",
      phone: "9999999999",
      email: "main@branch.com",
    },
  });

  // Hash password for admin
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // Create admin user
  await prisma.user.upsert({
    where: { email: "admin@jewels.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@jewels.com",
      password: hashedPassword,
      role: "ADMIN",
      gender: "MALE",
      phone: "9876543210",
      branchId: defaultBranch.id,
    },
  });

  console.log("✅ Admin seeded successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
