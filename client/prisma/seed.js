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

  // Create Admin Role
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Super Administrator',
      permissions: { "*": true },
      isSystem: true,
    }
  });

  // Create Manager Role
  const managerRole = await prisma.role.upsert({
    where: { name: 'MANAGER' },
    update: {},
    create: {
      name: 'MANAGER',
      description: 'Store Manager',
      permissions: {
        "Dashboard": ["VIEW_DASHBOARD", "VIEW_SALES_ANALYTICS", "VIEW_REVENUE"],
        "Customers": ["VIEW_CUSTOMER", "CREATE_CUSTOMER", "EDIT_CUSTOMER", "EXPORT_CUSTOMERS", "VIEW_CUSTOMER_WALLET"],
        "Jewellery": ["ADD_JEWELLERY", "EDIT_JEWELLERY", "CHANGE_PRICE", "UPLOAD_IMAGES", "PRINT_BARCODE"],
        "Inventory": ["VIEW_STOCK", "ADD_STOCK", "TRANSFER_STOCK", "STOCK_ADJUSTMENT"],
        "Orders": ["VIEW_ORDERS", "CREATE_ORDERS", "MODIFY_ORDERS", "CANCEL_ORDERS", "DELIVER_ORDERS", "APPROVE_ORDERS"],
        "Gold Rate": ["VIEW_RATE", "UPDATE_GOLD_RATE", "LOCK_RATE"],
        "Saving Scheme": ["CREATE_SCHEME", "EDIT_SCHEME", "CLOSE_SCHEME", "APPROVE_BONUS"],
        "Coupons": ["CREATE_COUPON", "EDIT_COUPON", "DISABLE_COUPON"],
        "Reports": ["VIEW_REPORTS", "EXPORT_PDF", "EXPORT_EXCEL", "PRINT_REPORTS"],
        "Finance": ["VIEW_PAYMENTS", "RECEIVE_PAYMENT", "APPLY_DISCOUNT"],
        "Settings": ["VIEW_SETTINGS"]
      },
      isSystem: true,
    }
  });

  // Create Sales Staff Role
  const salesRole = await prisma.role.upsert({
    where: { name: 'SALES_STAFF' },
    update: {},
    create: {
      name: 'SALES_STAFF',
      description: 'Sales Staff',
      permissions: {
        "Dashboard": ["VIEW_DASHBOARD"],
        "Customers": ["VIEW_CUSTOMER", "CREATE_CUSTOMER", "EDIT_CUSTOMER"],
        "Jewellery": ["PRINT_BARCODE"],
        "Inventory": ["VIEW_STOCK"],
        "Orders": ["VIEW_ORDERS", "CREATE_ORDERS", "MODIFY_ORDERS"],
        "Gold Rate": ["VIEW_RATE"],
        "Saving Scheme": ["CREATE_SCHEME", "EDIT_SCHEME"]
      },
      isSystem: true,
    }
  });

  // Create Billing Staff Role
  const billingRole = await prisma.role.upsert({
    where: { name: 'BILLING_STAFF' },
    update: {},
    create: {
      name: 'BILLING_STAFF',
      description: 'Billing & Cash Counter Staff',
      permissions: {
        "Dashboard": ["VIEW_DASHBOARD"],
        "Customers": ["VIEW_CUSTOMER", "CREATE_CUSTOMER", "EDIT_CUSTOMER", "VIEW_CUSTOMER_WALLET"],
        "Inventory": ["VIEW_STOCK"],
        "Orders": ["VIEW_ORDERS", "DELIVER_ORDERS"],
        "Gold Rate": ["VIEW_RATE"],
        "Finance": ["VIEW_PAYMENTS", "RECEIVE_PAYMENT", "APPLY_DISCOUNT"]
      },
      isSystem: true,
    }
  });

  // Create admin user
  await prisma.user.upsert({
    where: { email: "admin@jewels.com" },
    update: {
      systemRole: "ADMIN",
    },
    create: {
      name: "Admin",
      email: "admin@jewels.com",
      password: hashedPassword,
      roleId: adminRole.id,
      systemRole: "ADMIN",
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
