import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Operational Data Reset...");
  console.log("Preserving: Branch, BranchSettings, User, Role, Categories, System Configs.");

  // Delete transaction dependent tables first
  try {
    console.log("1. Clearing Invoice Payments...");
    await prisma.invoicePayment.deleteMany({});
  } catch (e: any) {
    console.log("Notice InvoicePayment clear:", e.message || e);
  }

  try {
    console.log("2. Clearing Invoice Items...");
    await prisma.invoiceItem.deleteMany({});
  } catch (e: any) {
    console.log("Notice InvoiceItem clear:", e.message || e);
  }

  try {
    console.log("3. Clearing Invoices...");
    await prisma.invoice.deleteMany({});
  } catch (e: any) {
    console.log("Notice Invoice clear:", e.message || e);
  }

  try {
    console.log("4. Clearing Draft Invoices...");
    await prisma.draftInvoice.deleteMany({});
  } catch (e: any) {
    console.log("Notice DraftInvoice clear:", e.message || e);
  }

  try {
    console.log("5. Clearing Product Bookings & Advances...");
    await prisma.bookingAdvance?.deleteMany({});
    await prisma.bookingTransfer?.deleteMany({});
    await prisma.bookingAuditLog?.deleteMany({});
    await prisma.productBooking?.deleteMany({});
  } catch (e: any) {
    console.log("Notice Bookings clear:", e.message || e);
  }

  try {
    console.log("6. Clearing Metal Exchange Sessions...");
    await prisma.metalExchangeSession?.deleteMany({});
  } catch (e: any) {
    console.log("Notice MetalExchange clear:", e.message || e);
  }

  try {
    console.log("7. Clearing Stock Audits & Inventory Transfers...");
    await prisma.stockAudit?.deleteMany({});
    await prisma.inventoryTransfer?.deleteMany({});
    await prisma.inventoryLedger?.deleteMany({});
    await prisma.inventoryCostLayer?.deleteMany({});
    await prisma.productBranchCost?.deleteMany({});
  } catch (e: any) {
    console.log("Notice Stock/Inventory clear:", e.message || e);
  }

  try {
    console.log("8. Clearing Purchases & Transactions...");
    await prisma.purchase?.deleteMany({});
    await prisma.transaction?.deleteMany({});
  } catch (e: any) {
    console.log("Notice Purchases clear:", e.message || e);
  }

  try {
    console.log("9. Clearing Product Items...");
    await prisma.productItem.deleteMany({});
  } catch (e: any) {
    console.log("Notice ProductItem clear:", e.message || e);
  }

  try {
    console.log("10. Clearing Customers...");
    await prisma.customer.deleteMany({});
  } catch (e: any) {
    console.log("Notice Customer clear:", e.message || e);
  }

  console.log("✅ Operational Reset Complete!");
  console.log("All Branches, Branch Settings, Admin Accounts, and Roles were PRESERVED intact.");
}

main()
  .catch((e) => {
    console.error("Error during reset:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
