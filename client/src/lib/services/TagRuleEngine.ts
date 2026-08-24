import { prisma } from "@/lib/prisma";

export const SYSTEM_TAGS = [
  {
    name: "REGULAR",
    label: "Regular Buyer",
    description: "Lifetime spent ₹1 to ₹5,00,000",
    color: "blue",
    type: "SYSTEM" as const,
  },
  {
    name: "HIGH_VALUE",
    label: "High Value Client",
    description: "Lifetime spent ₹5,00,000 to ₹10,00,000",
    color: "gold",
    type: "SYSTEM" as const,
  },
  {
    name: "VIP",
    label: "VIP Client",
    description: "Lifetime spent ₹10,00,000 to ₹25,00,000",
    color: "purple",
    type: "SYSTEM" as const,
  },
  {
    name: "ELITE",
    label: "Elite Client",
    description: "Lifetime spent over ₹25,00,000",
    color: "gold",
    type: "SYSTEM" as const,
  },
  {
    name: "CREDIT_RISK",
    label: "Credit Risk",
    description: "Total outstanding balance > ₹2,00,000",
    color: "red",
    type: "SYSTEM" as const,
  },
  {
    name: "FREQUENT_BUYER",
    label: "Frequent Buyer",
    description: "5+ purchases in the last 90 days",
    color: "blue",
    type: "SYSTEM" as const,
  },
  {
    name: "INACTIVE_CUSTOMER",
    label: "Inactive Customer",
    description: "No purchases in the last 12 months",
    color: "gray",
    type: "SYSTEM" as const,
  },
];

/**
 * Ensures system tag definitions exist in the database.
 */
export async function ensureSystemTagsExist() {
  for (const tag of SYSTEM_TAGS) {
    await prisma.tagDefinition.upsert({
      where: { name: tag.name },
      update: {
        label: tag.label,
        description: tag.description,
        color: tag.color,
        type: tag.type,
        isActive: true,
        isDeleted: false,
      },
      create: {
        name: tag.name,
        label: tag.label,
        description: tag.description,
        color: tag.color,
        type: tag.type,
      },
    });
  }
}

/**
 * Evaluates rules and updates tags for a single customer.
 */
export async function evaluateCustomerTags(customerId: number) {
  // 1. Ensure system tags exist first
  await ensureSystemTagsExist();

  // 2. Fetch customer details and invoice statistics
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      invoices: {
        select: {
          id: true,
          totalAmount: true,
          balanceAmount: true,
          isFullyPaid: true,
          createdAt: true,
        },
      },
      tags: {
        include: {
          tagDefinition: true,
        },
      },
    },
  });

  if (!customer) throw new Error(`Customer with ID ${customerId} not found`);

  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  // 3. Compute metrics
  const lifetimeSpent = customer.invoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
  const totalOutstanding = customer.invoices
    .filter((inv: any) => !inv.isFullyPaid)
    .reduce((sum: number, inv: any) => sum + inv.balanceAmount, 0);

  const purchasesLast90Days = customer.invoices.filter((inv: any) => new Date(inv.createdAt) >= ninetyDaysAgo).length;

  const lastPurchaseDate = customer.invoices.length > 0 
    ? new Date(Math.max(...customer.invoices.map((inv: any) => new Date(inv.createdAt).getTime())))
    : null;

  const isInactive = lastPurchaseDate !== null && lastPurchaseDate < twelveMonthsAgo;

  // 4. Determine status of each system tag
  const tagEvaluations: Record<string, { shouldHave: boolean; reason: string }> = {
    REGULAR: {
      shouldHave: lifetimeSpent > 0 && lifetimeSpent < 500000,
      reason: `First-time buyer with spent ₹${lifetimeSpent.toLocaleString("en-IN")} (Threshold: < ₹5,00,000)`,
    },
    HIGH_VALUE: {
      shouldHave: lifetimeSpent >= 500000 && lifetimeSpent < 1000000,
      reason: `High value buyer with spent ₹${lifetimeSpent.toLocaleString("en-IN")} (Threshold: ₹5,00,000 to ₹10,00,000)`,
    },
    VIP: {
      shouldHave: lifetimeSpent >= 1000000 && lifetimeSpent < 2500000,
      reason: `VIP status with spent ₹${lifetimeSpent.toLocaleString("en-IN")} (Threshold: ₹10,00,000 to ₹25,00,000)`,
    },
    ELITE: {
      shouldHave: lifetimeSpent >= 2500000,
      reason: `Elite status with spent ₹${lifetimeSpent.toLocaleString("en-IN")} (Threshold: >= ₹25,00,000)`,
    },
    CREDIT_RISK: {
      shouldHave: totalOutstanding > 200000,
      reason: `Outstanding balance is ₹${totalOutstanding.toLocaleString("en-IN")} (Threshold: ₹2,00,000)`,
    },
    FREQUENT_BUYER: {
      shouldHave: purchasesLast90Days >= 5,
      reason: `Purchases in last 90 days: ${purchasesLast90Days} (Threshold: 5)`,
    },
    INACTIVE_CUSTOMER: {
      shouldHave: isInactive,
      reason: lastPurchaseDate 
        ? `Last purchase was on ${lastPurchaseDate.toLocaleDateString("en-GB")} (>12 months ago)`
        : "No purchases found",
    },
  };

  // 5. Update Assignments
  for (const tagName of Object.keys(tagEvaluations)) {
    const { shouldHave, reason } = tagEvaluations[tagName];
    const def = await prisma.tagDefinition.findUnique({ where: { name: tagName } });
    if (!def) continue;

    const existingAssignment = customer.tags.find((t: any) => t.tagDefinition.name === tagName);

    if (shouldHave && !existingAssignment) {
      // Assign Tag
      await prisma.$transaction([
        prisma.customerTag.create({
          data: {
            customerId,
            tagDefinitionId: def.id,
            reason: `System Auto-Assign: ${reason}`,
          },
        }),
        prisma.tagAssignmentHistory.create({
          data: {
            customerId,
            tagDefinitionId: def.id,
            tagLabel: def.label,
            action: "ADDED",
            reason: `System Auto-Assign: ${reason}`,
          },
        }),
      ]);
    } else if (!shouldHave && existingAssignment) {
      // Remove Tag
      await prisma.$transaction([
        prisma.customerTag.delete({
          where: {
            id: existingAssignment.id,
          },
        }),
        prisma.tagAssignmentHistory.create({
          data: {
            customerId,
            tagDefinitionId: def.id,
            tagLabel: def.label,
            action: "REMOVED",
            reason: `System Auto-Remove: ${reason}`,
          },
        }),
      ]);
    }
  }
}

/**
 * Runs evaluation on all customers in the database.
 */
export async function evaluateAllCustomers() {
  await ensureSystemTagsExist();
  const customers = await prisma.customer.findMany({ select: { id: true } });
  
  for (const c of customers) {
    try {
      await evaluateCustomerTags(c.id);
    } catch (err) {
      console.error(`Failed to evaluate tags for customer ID ${c.id}`, err);
    }
  }
}
