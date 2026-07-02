const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Resetting SchemeRedemption...");
  await prisma.schemeRedemption.deleteMany();
  
  console.log("Resetting SchemeDeposit...");
  await prisma.schemeDeposit.deleteMany();
  
  console.log("Resetting SavingScheme...");
  await prisma.savingScheme.deleteMany();

  console.log("Resetting InvoicePayment...");
  await prisma.invoicePayment.deleteMany();

  console.log("Resetting InvoiceItem...");
  await prisma.invoiceItem.deleteMany();

  console.log("Resetting Invoice...");
  await prisma.invoice.deleteMany();

  console.log("Resetting DraftInvoice...");
  await prisma.draftInvoice.deleteMany();

  console.log("Resetting Advance...");
  await prisma.advance.deleteMany();

  console.log("Resetting Booking tables...");
  await prisma.bookingLedger.deleteMany();
  await prisma.bookingAuditLog.deleteMany();
  await prisma.bookingTransfer.deleteMany();
  await prisma.deliverySession.deleteMany();
  await prisma.bookingItem.deleteMany();
  await prisma.bookingAdvance.deleteMany();
  await prisma.productBooking.deleteMany();
  
  console.log("Reset complete.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
