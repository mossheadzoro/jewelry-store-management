import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const branchId = 1;

  try {
    const customers = await prisma.customer.findMany({
      skip: 0,
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        tags: { include: { tagDefinition: true } },
        invoices: {
          where: { branchId },
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            balanceAmount: true,
            isFullyPaid: true,
            createdAt: true,
            items: {
              select: {
                product: {
                  select: {
                    name: true,
                    subCategory: {
                      select: { name: true, category: { select: { name: true } } }
                    }
                  }
                }
              },
              take: 1
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    console.log(`Found ${customers.length} customers.`);
    if (customers.length > 0) {
      console.log(customers.map(c => c.name));
    }
  } catch (err) {
    console.error(err);
  } finally {
    prisma.$disconnect();
  }
}

run();
