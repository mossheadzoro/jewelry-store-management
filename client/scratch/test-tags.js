const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Import TagRuleEngine logic manually since we are in JS environment
async function evaluateCustomerWithLogs(customerId) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      invoices: true,
      tags: { include: { tagDefinition: true } }
    }
  });

  if (!customer) {
    console.log(`Customer ${customerId} not found`);
    return;
  }

  console.log(`\nEvaluating Customer: ${customer.name} (ID: ${customer.id})`);
  
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const lifetimeSpent = customer.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalOutstanding = customer.invoices
    .filter((inv) => !inv.isFullyPaid)
    .reduce((sum, inv) => sum + inv.balanceAmount, 0);
  const purchasesLast90Days = customer.invoices.filter((inv) => new Date(inv.createdAt) >= ninetyDaysAgo).length;
  const lastPurchaseDate = customer.invoices.length > 0 
    ? new Date(Math.max(...customer.invoices.map((inv) => new Date(inv.createdAt).getTime())))
    : null;
  const isInactive = lastPurchaseDate !== null && lastPurchaseDate < twelveMonthsAgo;

  console.log(`- Lifetime Spent: ₹${lifetimeSpent.toLocaleString("en-IN")}`);
  console.log(`- Total Outstanding: ₹${totalOutstanding.toLocaleString("en-IN")}`);
  console.log(`- Purchases in last 90 days: ${purchasesLast90Days}`);
  console.log(`- Last Purchase Date: ${lastPurchaseDate ? lastPurchaseDate.toLocaleDateString("en-GB") : "None"}`);
  console.log(`- Is Inactive: ${isInactive}`);

  const tagEvaluations = {
    HIGH_VALUE: lifetimeSpent > 1000000,
    CREDIT_RISK: totalOutstanding > 200000,
    FREQUENT_BUYER: purchasesLast90Days >= 5,
    INACTIVE_CUSTOMER: isInactive
  };

  console.log("- Expected tags:", tagEvaluations);
}

async function main() {
  const customers = await prisma.customer.findMany({
    include: { invoices: true }
  });

  console.log(`Total customers in database: ${customers.length}`);
  
  for (const c of customers) {
    await evaluateCustomerWithLogs(c.id);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
