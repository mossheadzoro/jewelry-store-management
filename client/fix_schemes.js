const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schemes = await prisma.savingScheme.findMany({
    include: {
      deposits: true
    }
  });

  for (const scheme of schemes) {
    let actualCash = 0;
    let actualBonus = 0;
    
    for (const d of scheme.deposits) {
      if (d.depositType === "CASH") {
        actualCash += (d.cashAmount || 0);
      }
      if (d.depositType === "BONUS" || d.isBonus) {
        actualBonus += (d.cashAmount || 0);
      }
    }

    if (scheme.totalCashDeposited !== actualCash || scheme.totalBonusAmount !== actualBonus) {
      console.log(`Fixing Scheme ${scheme.schemeNumber}: Cash ${scheme.totalCashDeposited} -> ${actualCash}, Bonus ${scheme.totalBonusAmount} -> ${actualBonus}`);
      
      await prisma.savingScheme.update({
        where: { id: scheme.id },
        data: {
          totalCashDeposited: actualCash,
          totalBonusAmount: actualBonus
        }
      });
    }
  }
  
  console.log("DB fix complete.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
