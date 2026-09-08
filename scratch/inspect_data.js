const { PrismaClient } = require('../client/src/generated/client');
const prisma = new PrismaClient();

async function inspectData() {
  const products = await prisma.productItem.findMany({ include: { subCategory: true, stoneDetails: true } });
  const customers = await prisma.customer.findMany();
  const invoices = await prisma.invoice.findMany({ include: { items: true, payments: true } });
  const verifications = await prisma.verificationRequest.findMany({ include: { items: true, approvals: true } });
  const bookings = await prisma.purchaseBooking.findMany();
  const bullionSuppliers = await prisma.bullionSupplier.findMany();
  const rateLedger = await prisma.goldRateHistoryLedger.findMany({ take: 5, orderBy: { recordedAt: 'desc' } });
  
  console.log('--- PRODUCTS ---');
  console.log(JSON.stringify(products, null, 2));

  console.log('--- CUSTOMERS ---');
  console.log(JSON.stringify(customers, null, 2));

  console.log('--- INVOICES ---');
  console.log(JSON.stringify(invoices, null, 2));

  console.log('--- VERIFICATION REQUESTS ---');
  console.log(JSON.stringify(verifications, null, 2));

  console.log('--- PURCHASE BOOKINGS ---');
  console.log(JSON.stringify(bookings, null, 2));

  console.log('--- BULLION SUPPLIERS ---');
  console.log(JSON.stringify(bullionSuppliers, null, 2));

  console.log('--- LATEST GOLD RATES (Sample) ---');
  console.log(JSON.stringify(rateLedger, null, 2));

  await prisma.$disconnect();
}

inspectData();
