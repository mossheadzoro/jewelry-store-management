import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testRaw() {
  try {
    const branchId = 1;
    const vipResult = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM (
        SELECT c.id
        FROM "Customer" c
        JOIN "Invoice" i ON i."customerId" = c.id
        WHERE i."branchId" = ${branchId}
        GROUP BY c.id
        HAVING COUNT(i.id) >= 10 OR SUM(i."totalAmount") >= 1000000
      ) vips
    `);
    console.log("VIP Result:", vipResult);
  } catch (err) {
    console.error("Query failed:", err);
  } finally {
    prisma.$disconnect();
  }
}

testRaw();
