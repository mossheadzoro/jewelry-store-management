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

  // Seed CompanySettings if not exists
  const existingSettings = await prisma.companySettings.findFirst();
  if (!existingSettings) {
    await prisma.companySettings.create({
      data: {
        companyName: "Main Jewelry Store",
        costingMethod: "WAC",
        requireHuidForSales: false,
        defaultLockDays: 90,
        financialYearStart: 4,
      },
    });
    console.log("✅ Company settings seeded successfully.");
  } else {
    console.log("ℹ️ Company settings already exist.");
  }

  // Seed MetalRateHistory if empty
  const rateCount = await prisma.metalRateHistory.count();
  if (rateCount === 0) {
    await prisma.metalRateHistory.createMany({
      data: [
        { metalType: "GOLD", karatage: 22, rate: 65.5, rateUnit: "PER_GRAM" },
        { metalType: "GOLD", karatage: 18, rate: 54.0, rateUnit: "PER_GRAM" },
        { metalType: "GOLD", karatage: 14, rate: 43.0, rateUnit: "PER_GRAM" },
        { metalType: "SILVER", karatage: null, rate: 0.85, rateUnit: "PER_GRAM" },
        { metalType: "PLATINUM", karatage: null, rate: 32.0, rateUnit: "PER_GRAM" },
      ],
    });
    console.log("✅ Metal rate history seeded successfully.");
  } else {
    console.log("ℹ️ Metal rate history already exists.");
  }
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
