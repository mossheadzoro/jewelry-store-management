import { prisma } from "../../../libs/prisma";

export async function getNextSequence(tx: any, branchId: number, categoryName: string, increment: boolean = false): Promise<number> {
  if (increment) {
    const tracker = await tx.sequenceTracker.upsert({
      where: { branchId_categoryName: { branchId, categoryName } },
      update: { lastValue: { increment: 1 } },
      create: { branchId, categoryName, lastValue: 1 },
    });
    return tracker.lastValue;
  } else {
    const tracker = await tx.sequenceTracker.findUnique({
      where: { branchId_categoryName: { branchId, categoryName } }
    });
    return (tracker?.lastValue || 0) + 1;
  }
}

export async function generateCodesHelper(tx: any, branchId: number, categoryType: string, categoryName: string, increment: boolean, offset: number = 0) {
  const branch = await tx.branch.findUnique({
    where: { id: branchId },
    select: { name: true },
  });

  if (!branch) throw new Error("Branch not found");

  const branchCode = branch.name.substring(0, 3).toUpperCase();
  const categoryPrefix = categoryName.substring(0, 3).toUpperCase();

  let nextSeq = await getNextSequence(tx, branchId, categoryName, increment);
  if (!increment) nextSeq += offset;

  const seqStr = String(nextSeq).padStart(5, "0");

  // Old style ProductCode
  const productCode = `${branchCode}${branchId}${categoryType}${categoryPrefix}${seqStr}`;

  // Numeric style Barcode
  const now = new Date();
  const datePart = `${String(now.getFullYear()).slice(-2)}${String(
    now.getMonth() + 1
  ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const barcode = `${String(branchId).padStart(2, "0")}${String(categoryType).padStart(2, "0")}${datePart}${seqStr}`;

  return { productCode, barcode };
}

export async function generateCodes(branchId: number, categoryType: string, categoryName: string) {
  return generateCodesHelper(prisma, branchId, categoryType, categoryName, false);
}
