const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.productItem.updateMany({
    where: { reservedQty: { gt: 0 } },
    data: { reservedQty: 0 }
  });
  console.log(`✅ Reset ${result.count} stale product reservation(s) to 0.`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
