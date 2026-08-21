import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAnkan() {
  const customer = await prisma.customer.findFirst({
    where: { name: { contains: "ANKAN", mode: "insensitive" } },
    include: { CustomerWallet: true }
  });
  console.log("Customer:", JSON.stringify(customer, null, 2));

  if (customer) {
    const ledger = await prisma.inventoryLedger.findMany({
      where: { remarks: { contains: customer.name } }
    });
    console.log("Ledger Entries:", JSON.stringify(ledger, null, 2));
  }
}

checkAnkan().finally(() => prisma.$disconnect());
