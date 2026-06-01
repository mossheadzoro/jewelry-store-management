/**
 * Backfill Script: Populate sequenceNo on existing InventoryLedger entries
 *
 * This script assigns monotonically increasing sequenceNo values to all
 * existing ledger entries that don't have one, grouped by productId+branchId
 * and ordered by createdAt ASC.
 *
 * Usage:
 *   npx ts-node prisma/backfill-sequence-no.ts
 *
 * Safe to run multiple times — only updates entries where sequenceNo IS NULL.
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function backfillSequenceNumbers() {
  console.log("🔄 Starting sequenceNo backfill...");

  // Get all unique product+branch combinations that have ledger entries
  const combinations = await prisma.$queryRaw`
    SELECT DISTINCT "productId", "branchId"
    FROM "InventoryLedger"
    WHERE "sequenceNo" IS NULL
    ORDER BY "productId", "branchId"
  `;

  console.log(
    `📋 Found ${(combinations as any[]).length} product+branch combinations to backfill.`
  );

  let totalUpdated = 0;

  for (const combo of combinations as any[]) {
    const { productId, branchId } = combo;

    // Fetch all entries for this combo, ordered by createdAt
    const entries = await prisma.inventoryLedger.findMany({
      where: {
        productId,
        branchId,
        sequenceNo: null,
      },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    // Find the highest existing sequenceNo for this combo (in case some already have one)
    const maxEntry = await prisma.inventoryLedger.findFirst({
      where: {
        productId,
        branchId,
        sequenceNo: { not: null },
      },
      orderBy: { sequenceNo: "desc" },
      select: { sequenceNo: true },
    });

    let seqNo = maxEntry?.sequenceNo ?? 0;

    // Update each entry with the next sequence number
    for (const entry of entries) {
      seqNo++;
      await prisma.inventoryLedger.update({
        where: { id: entry.id },
        data: { sequenceNo: seqNo },
      });
      totalUpdated++;
    }

    if (entries.length > 0) {
      console.log(
        `  ✅ Product ${productId} @ Branch ${branchId}: assigned seqNo 1-${seqNo} (${entries.length} entries)`
      );
    }
  }

  console.log(`\n🎉 Backfill complete! Updated ${totalUpdated} entries.`);
}

backfillSequenceNumbers()
  .catch((error) => {
    console.error("❌ Backfill failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
