const { PrismaClient } = require('../client/src/generated/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Connecting to database...');
    const branchCount = await prisma.branch.count();
    const productCount = await prisma.productItem.count();
    const customerCount = await prisma.customer.count();
    const invoiceCount = await prisma.invoice.count();
    const orderCount = await prisma.order.count();
    const userCount = await prisma.user.count();
    console.log('Connected successfully!');
    console.log({ branchCount, productCount, customerCount, invoiceCount, orderCount, userCount });
  } catch (err) {
    console.log('DB Connection failed or offline:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
