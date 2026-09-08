const { PrismaClient } = require('../client/src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const branches = await prisma.branch.findMany();
  console.log('Branches:', branches.map(b => ({ id: b.id, name: b.name })));

  const categories = await prisma.category.findMany({
    include: { subCategories: true }
  });
  console.log('Categories & Subcategories:');
  categories.forEach(c => {
    console.log(`- Category [${c.id}] ${c.name} (branchId: ${c.branchId}):`);
    c.subCategories.forEach(sc => {
      console.log(`    SubCategory [${sc.id}] ${sc.name}`);
    });
  });

  const products = await prisma.productItem.findMany({
    include: { subCategory: { include: { category: true } } }
  });
  console.log('\nTotal Products:', products.length);
  products.forEach(p => {
    console.log(`- Product [${p.id}] "${p.name}" | code: ${p.productCode} | barcode: ${p.barcode} | subCat: ${p.subCategory?.name} | cat: ${p.subCategory?.category?.name} | gs: ${p.gsWeight}g | nt: ${p.ntWeight}g | qty: ${p.quantity} | purity: ${p.purity}`);
  });

  const ledger = await prisma.inventoryLedger.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log('\nRecent Ledger Entries:', ledger.length);
  ledger.forEach(l => {
    console.log(`- Ledger [${l.id}] prodId: ${l.productId} | txn: ${l.txnType} | grossIn: ${l.grossWeightIn} | grossOut: ${l.grossWeightOut} | balGross: ${l.balanceGrossWt} | balFine: ${l.balanceFineWt} | seq: ${l.sequenceNo} | remarks: ${l.remarks}`);
  });

  const receipts = await prisma.purchaseMetalReceipt.findMany({
    orderBy: { receiptDate: 'desc' },
    take: 5
  });
  console.log('\nRecent Metal Receipts:', receipts.length);
  receipts.forEach(r => {
    console.log(`- Receipt [${r.id}] ${r.receiptNumber} | category: ${r.metalCategory} | actualGross: ${r.actualGrossWeight}g | status: ${r.status}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
