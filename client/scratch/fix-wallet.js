import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixAnkan() {
  const count = await prisma.customer.count();
  console.log("Total Customers:", count);

  const customers = await prisma.customer.findMany({
    where: { walletBalance: { gt: 0 } },
    include: { CustomerWallet: true }
  });

  for (const customer of customers) {
    if (!customer.CustomerWallet) {
      console.log(`Fixing wallet for ${customer.name} (ID: ${customer.id}) with balance ${customer.walletBalance}`);
      
      const walletId = `WAL-${customer.id}`;
      
      await prisma.customerWallet.create({
        data: {
          id: walletId,
          customerId: customer.id,
          metal24KBalance: customer.walletBalance,
          updatedAt: new Date()
        }
      });

      await prisma.customerWalletLedger.create({
        data: {
          id: `CWL-MIG-${Date.now()}-${customer.id}`,
          walletId: walletId,
          transactionType: "CREDIT",
          assetType: "METAL_24K",
          amount: customer.walletBalance,
          description: "Migrated from legacy wallet balance (Tonch deposit)",
          relatedEntityId: null
        }
      });

      console.log(`Wallet fixed for ${customer.name}`);
    }
  }
}

fixAnkan().catch(console.error).finally(() => prisma.$disconnect());
