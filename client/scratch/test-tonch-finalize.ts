import { prisma } from "../src/lib/prisma";
import { roundFineGold } from "../src/lib/fineGold";

async function main() {
  const itemId = "cmtbeb9250024bz4octzz9epk";
  const item = await prisma.metalExchangeItem.findUnique({
    where: { id: itemId },
    include: { session: true, customer: true },
  });
  console.log("Current item status before test:", item?.status);

  const body = {
    itemId,
    weightBefore: 12,
    weightAfter: 11.96,
    purityPercent: 91.6,
    userId: 1,
  };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const fine = roundFineGold(body.weightAfter * (body.purityPercent / 100));

      const updatedItem = await tx.metalExchangeItem.update({
        where: { id: body.itemId },
        data: {
          weightAfter: body.weightAfter,
          purityPercent: body.purityPercent,
          tonch: body.purityPercent / 100,
          fineGold: fine,
          lossWeight: body.weightBefore - body.weightAfter,
          status: "TONCHED",
          isLocked: true,
        },
        include: {
          customer: true,
          session: true,
        },
      });

      // 1. Session ledger
      await tx.metalExchangeSession.update({
        where: { id: updatedItem.sessionId },
        data:
          updatedItem.metalType === "GOLD"
            ? {
                fineGold: { increment: fine },
                totalWeightAfter: { increment: body.weightAfter },
              }
            : {
                fineSilver: { increment: fine },
                totalWeightAfter: { increment: body.weightAfter },
              },
      });

      // 2. Customer wallet
      if (updatedItem.customerId) {
        let wallet = await tx.customerWallet.findUnique({
          where: { customerId: updatedItem.customerId },
        });

        if (!wallet) {
          wallet = await tx.customerWallet.create({
            data: {
              id: `wallet_${updatedItem.customerId}_${Date.now()}`,
              customerId: updatedItem.customerId,
              metal24KBalance: fine,
              updatedAt: new Date(),
            },
          });
        } else {
          wallet = await tx.customerWallet.update({
            where: { id: wallet.id },
            data: {
              metal24KBalance: { increment: fine },
              updatedAt: new Date(),
            },
          });
        }

        await tx.customerWalletLedger.create({
          data: {
            id: `CWL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            walletId: wallet.id,
            transactionType: "CREDIT",
            assetType: "METAL_24K",
            amount: fine,
            description: `Old Gold Deposit from Tonch (Item: ${updatedItem.id.slice(-4)})`,
            relatedEntityId: updatedItem.id,
          },
        });
      }

      // 3. Branch stock ledger
      const branchId = updatedItem.session.branchId;
      let existingProduct = await tx.productItem.findFirst({
        where: { branchId },
        select: { id: true },
      });

      if (!existingProduct) {
        let cat = await tx.category.findFirst({ where: { name: "Raw Metal", branchId } });
        if (!cat) cat = await tx.category.create({ data: { name: "Raw Metal", branchId } });
        let subcat = await tx.subCategory.findFirst({ where: { name: "Old Gold", categoryId: cat.id } });
        if (!subcat) subcat = await tx.subCategory.create({ data: { name: "Old Gold", categoryId: cat.id, branchId } });
        existingProduct = await tx.productItem.create({
          data: {
            name: "Old Gold Stock",
            barcode: "OLDGOLD-" + Date.now(),
            productCode: "OLDGOLD",
            gsWeight: 0,
            ntWeight: 0,
            purity: 100,
            branchId,
            subCategoryId: subcat.id,
          },
          select: { id: true },
        });
      }

      await tx.inventoryLedger.create({
        data: {
          productId: existingProduct.id,
          branchId,
          txnType: "OLD_GOLD_IN",
          refType: "METAL_EXCHANGE",
          refId: updatedItem.id,
          qtyIn: 1,
          qtyOut: 0,
          grossWeightIn: 0,
          netWeightIn: 0,
          fineWeightIn: fine,
          purityPercent: updatedItem.purityPercent || undefined,
          remarks: `${updatedItem.session.sessionNumber}-${updatedItem.id.slice(-4).toUpperCase()} - ${updatedItem.customer.name}`,
          createdById: body.userId || null,
        },
      });

      return updatedItem;
    });

    console.log("SUCCESS! Updated item status:", result.status);

    // Check can close
    const totalItems = await prisma.metalExchangeItem.count({
      where: { sessionId: item?.sessionId },
    });

    const pendingItems = await prisma.metalExchangeItem.count({
      where: {
        sessionId: item?.sessionId,
        status: { in: ["PENDING", "PROCESSING"] },
      },
    });

    const canClose = totalItems > 0 && pendingItems === 0;
    console.log("Session Total Items:", totalItems, "Pending Items:", pendingItems, "Can Close Day:", canClose);
  } catch (err: any) {
    console.error("TRANSACTION FAILED:", err);
  }
}

main().catch(console.error);
