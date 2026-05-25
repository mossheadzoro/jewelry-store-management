import { prisma } from "../../../libs/prisma";



export async function generateCodes(branchId: number, categoryType: string, categoryName: string) {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { name: true },
  });

  if (!branch) throw new Error("Branch not found");

  const branchCode = branch.name.substring(0, 3).toUpperCase();
  const categoryPrefix = categoryName.substring(0, 3).toUpperCase();

  const lastProduct = await prisma.productItem.findFirst({
    where: { branchId, barcode: { startsWith: branchCode } },
    orderBy: { id: "desc" },
    select: { id: true },
  });

  const nextSeq = lastProduct ? lastProduct.id + 1 : 1;
  const seqStr = String(nextSeq).padStart(5, "0");

  const productCode = `${branchCode}${branchId}${categoryType}${categoryPrefix}${seqStr}`;
  const barcode = `${branchCode}${String(branchId).padStart(2, "0")}${categoryType}${seqStr}`;

  return { productCode, barcode };
}
