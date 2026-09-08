const { PrismaClient } = require('../client/src/generated/client');
const prisma = new PrismaClient();

async function inspectSpecifics() {
  const products = await prisma.productItem.findMany();
  console.log('--- PRODUCT ITEMS ---');
  products.forEach(p => console.log({
    id: p.id,
    name: p.name,
    code: p.productCode,
    barcode: p.barcode,
    huid: p.huidNumber,
    qty: p.quantity,
    reserved: p.reservedQty,
    allowNegative: p.allowNegativeStock,
    gsWeight: p.gsWeight,
    ntWeight: p.ntWeight,
    purity: p.purity
  }));

  const invoices = await prisma.invoice.findMany({
    include: { items: true, payments: true }
  });
  console.log('--- INVOICES ---');
  invoices.forEach(inv => console.log({
    id: inv.id,
    number: inv.invoiceNumber,
    customerId: inv.customerId,
    totalAmount: inv.totalMetalAmount + inv.totalMakingAmount + inv.totalStoneAmount,
    taxOnGold: inv.taxOnGold,
    itemsCount: inv.items.length,
    paymentsCount: inv.payments.length,
    payments: inv.payments
  }));

  const ledger = await prisma.inventoryLedger.findMany();
  console.log('--- INVENTORY LEDGER ---');
  ledger.forEach(l => console.log({
    id: l.id,
    productId: l.productId,
    direction: l.direction,
    transactionType: l.transactionType,
    quantity: l.quantity,
    runningBalanceQty: l.runningBalanceQty,
    runningFineWeight: l.runningFineWeight,
    isLocked: l.isLocked
  }));

  const tags = await prisma.tagDefinition.findMany();
  console.log('--- TAG DEFINITIONS ---');
  tags.forEach(t => console.log({ id: t.id, name: t.name, color: t.color, category: t.category }));

  await prisma.$disconnect();
}

inspectSpecifics();
