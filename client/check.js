const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@jewels.com' } });
  console.log('Role in DB:', user?.systemRole);
}
main().finally(() => prisma.$disconnect());
