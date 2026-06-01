import { evaluateAllCustomers } from "../src/lib/services/TagRuleEngine";
import { prisma } from "../libs/prisma";

async function main() {
  console.log("Running evaluateAllCustomers...");
  await evaluateAllCustomers();
  
  console.log("=== CUSTOMER TAGS IN DB ===");
  const tags = await prisma.customerTag.findMany({
    include: {
      customer: { select: { name: true } },
      tagDefinition: true
    }
  });
  console.log(JSON.stringify(tags, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
