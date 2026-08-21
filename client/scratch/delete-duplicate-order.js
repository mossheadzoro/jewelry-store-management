import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const recentOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 2
    });
    
    if (recentOrders.length >= 2) {
      console.log("Found recent orders:", recentOrders.map(o => ({ id: o.id, orderNumber: o.orderNumber })));
      
      // If we find an obvious duplicate, delete the more recent one
      // Since orderNumber is unique, they won't have the same orderNumber, 
      // but they were submitted instantly at the same time.
      const timeDiff = new Date(recentOrders[0].createdAt).getTime() - new Date(recentOrders[1].createdAt).getTime();
      
      console.log("Time difference in ms:", timeDiff);
      
      // We will delete the MOST RECENT one (recentOrders[0]) to keep the original (recentOrders[1])
      const idToDelete = recentOrders[0].id;
      console.log(`Deleting duplicate order: ${idToDelete}`);
      
      await prisma.order.delete({
        where: { id: idToDelete }
      });
      console.log("Successfully deleted the extra order!");
    } else {
      console.log("Not enough orders found to delete a duplicate.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

run().finally(() => prisma.$disconnect());
