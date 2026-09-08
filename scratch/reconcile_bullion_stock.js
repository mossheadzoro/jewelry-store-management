const { PrismaClient } = require('../client/src/generated/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== RECONCILING BULLION STOCK IN DATABASE ===");

  const branch = await prisma.branch.findFirst();
  if (!branch) throw new Error("Branch not found");
  const branchId = branch.id;

  // 1. Locate or ensure Category "Gold"
  let goldCategory = await prisma.category.findFirst({
    where: {
      branchId,
      name: { in: ["Gold", "GOLD"], mode: "insensitive" }
    }
  });

  if (!goldCategory) {
    goldCategory = await prisma.category.create({
      data: {
        name: "Gold",
        description: "Fine Gold Jewellery & Bullion",
        branchId,
      }
    });
    console.log(`Created Category: "${goldCategory.name}" [ID: ${goldCategory.id}]`);
  } else {
    console.log(`Found Category: "${goldCategory.name}" [ID: ${goldCategory.id}]`);
  }

  // 2. Locate or create SubCategory "24k FREE GOLD STOCK"
  let freeGoldSubCat = await prisma.subCategory.findFirst({
    where: {
      branchId,
      categoryId: goldCategory.id,
      name: { in: ["24k FREE GOLD STOCK", "24K FREE GOLD STOCK", "24K Free Gold Stock"], mode: "insensitive" }
    }
  });

  if (!freeGoldSubCat) {
    freeGoldSubCat = await prisma.subCategory.create({
      data: {
        name: "24k FREE GOLD STOCK",
        categoryId: goldCategory.id,
        branchId,
      }
    });
    console.log(`Created SubCategory: "${freeGoldSubCat.name}" [ID: ${freeGoldSubCat.id}] under Category [${goldCategory.id}]`);
  } else {
    console.log(`Found SubCategory: "${freeGoldSubCat.name}" [ID: ${freeGoldSubCat.id}]`);
  }

  // 3. Find Product #4 (or any product with productCode "BULLION-GOLD_24K")
  const bullionProduct = await prisma.productItem.findFirst({
    where: {
      branchId,
      OR: [
        { productCode: "BULLION-GOLD_24K" },
        { name: { contains: "Bullion", mode: "insensitive" } },
      ]
    },
    include: { subCategory: true }
  });

  if (bullionProduct) {
    console.log(`Found existing bullion product: [ID: ${bullionProduct.id}] "${bullionProduct.name}" in subCategory: "${bullionProduct.subCategory?.name}"`);
    console.log(`Current Weights -> gsWeight: ${bullionProduct.gsWeight}g, ntWeight: ${bullionProduct.ntWeight}g, quantity: ${bullionProduct.quantity}`);

    // Update product to dedicated 24k FREE GOLD STOCK subcategory and correct 2g weight
    const updated = await prisma.productItem.update({
      where: { id: bullionProduct.id },
      data: {
        name: "24k FREE GOLD STOCK",
        subCategoryId: freeGoldSubCat.id,
        gsWeight: 2.000,
        ntWeight: 2.000,
        quantity: 1,
        purity: 99.5,
        allowNegativeStock: true,
      }
    });

    console.log(`✅ Updated Product [ID: ${updated.id}]:`);
    console.log(`   Name: "${updated.name}"`);
    console.log(`   SubCategory ID: ${updated.subCategoryId} (${freeGoldSubCat.name})`);
    console.log(`   gsWeight: ${updated.gsWeight}g (corrected from 4g to 2g)`);
    console.log(`   ntWeight: ${updated.ntWeight}g (corrected from 4g to 2g)`);
    console.log(`   quantity: ${updated.quantity} (corrected from 2 to 1)`);
  } else {
    console.log("No existing bullion product found to reconcile.");
  }

  // 4. Verify Ledger Entries for Product #4
  if (bullionProduct) {
    const ledger = await prisma.inventoryLedger.findMany({
      where: { productId: bullionProduct.id },
      orderBy: { createdAt: "desc" }
    });
    console.log(`\nLedger Entries for Product [${bullionProduct.id}]: ${ledger.length}`);
    ledger.forEach(l => {
      console.log(`- [${l.id}] txn: ${l.txnType} | grossIn: ${l.grossWeightIn}g | balGross: ${l.balanceGrossWt}g | balFine: ${l.balanceFineWt}g`);
    });
  }

  console.log("\n=== RECONCILIATION COMPLETE ===");
}

main().catch(console.error).finally(() => prisma.$disconnect());
