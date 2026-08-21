import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({ include: { userBranches: true, role: true } });
  console.log(JSON.stringify(users, null, 2));
}

run().finally(() => prisma.$disconnect());
