const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin(email, password) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user || !user.password) {
    console.log(`User ${email} not found or no password`);
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  console.log(`User ${email} - isPasswordValid: ${isPasswordValid}`);
}

async function main() {
  await testLogin('admin@jewels.com', 'admin123');
  await testLogin('manager@jewels.com', 'admin123');
  await testLogin('salesman@jewels.com', 'admin123');
}

main().finally(() => prisma.$disconnect());
