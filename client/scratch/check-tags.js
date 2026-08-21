import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const c = await prisma.customer.findFirst({ include: { tags: true } });
  console.log(JSON.stringify(c, null, 2));
}

run().finally(() => prisma.$disconnect());
