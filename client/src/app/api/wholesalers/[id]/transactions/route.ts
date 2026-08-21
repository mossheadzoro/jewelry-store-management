import { NextResponse } from "next/server";
import { prisma } from "../../../../../../libs/prisma";

// ─── Wholesale rounded purity % for Gold ─────────────────────────────────────
// In wholesale business, purities are rounded: 22K=92, 20K=83, 18K=75, etc.
const GOLD_PURITY_PCT: Record<string, number> = {
  "22K": 92,
  "20K": 83,
  "18K": 75,
  "14K": 58,
  "9K":  37,
};

// ─── POST ─ Create a new transaction ─────────────────────────────────────────
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: wholesalerId } = await context.params;
    const body = await req.json();

    const {
      type,         // "ISSUE_METAL" | "RECEIVE_JEWELLERY"
      metalType,    // "GOLD" | "SILVER" | "DIAMOND"
      purityLabel,  // "22K" | "20K" | "18K" | "14K" | "9K"  OR decimal string for silver e.g. "92.50"
      weight,       // number
      wastage,      // number (%)
      cashItems,    // [{ itemName: string, cost: number }]
      remarks,
    } = body;

    // ── Validate required fields ────────────────────────────────────────────
    if (!type || !metalType) {
      return NextResponse.json(
        { error: "type and metalType are required" },
        { status: 400 }
      );
    }

    const wholesaler = await prisma.wholesaler.findUnique({
      where: { id: wholesalerId },
    });

    if (!wholesaler) {
      return NextResponse.json(
        { error: "Wholesaler not found" },
        { status: 404 }
      );
    }

    let purityFactor = 0;
    let fineWeight = 0;
    const weightNum = Number(weight) || 0;
    const wastageNum = type === "ISSUE_METAL" ? 0 : (Number(wastage) || 0);

    // If ISSUE_METAL, it's strictly 24K pure (factor 1.0) with zero wastage
    if (type === "ISSUE_METAL") {
      purityFactor = 1.0;
      fineWeight = weightNum;
    } else {
      if (metalType === "GOLD") {
        // Wholesale formula: Fine = weight × (roundedPurity + wastage) / 100
        const purityPct = GOLD_PURITY_PCT[purityLabel] ?? 0;
        purityFactor = (purityPct + wastageNum) / 100;
        fineWeight = weightNum * purityFactor;
      } else if (metalType === "SILVER") {
        // Silver: user enters purity as decimal (e.g. 92.50), same formula
        const purityPct = Number(purityLabel) || 0;
        purityFactor = (purityPct + wastageNum) / 100;
        fineWeight = weightNum * purityFactor;
      }
    }

    // ── Cash items total ───────────────────────────────────────────────────
    const items: { itemName: string; cost: number }[] = Array.isArray(cashItems)
      ? cashItems
      : [];
    const totalCashAmount = items.reduce(
      (sum, item) => sum + (Number(item.cost) || 0),
      0
    );

    // Order IDs to assign or complete
    const orderIds: string[] = Array.isArray(body.orderIds) ? body.orderIds : [];
    const receiveOrderDetails: Array<{
      orderId: string;
      netWeight: number;
      wastage: number;
      purityLabel: string;
      fineWeight: number;
      laborCharge: number;
    }> = Array.isArray(body.receiveOrderDetails) ? body.receiveOrderDetails : [];

    // Branch ID
    const branchId = wholesaler.branchId;

    // ── Build balance delta ────────────────────────────────────────────────
    let goldDelta = 0;
    let silverDelta = 0;
    let moneyDelta = 0;

    if (type === "ISSUE_METAL") {
      if (metalType === "GOLD") goldDelta = +fineWeight;
      if (metalType === "SILVER") silverDelta = +fineWeight;
    } else if (type === "RECEIVE_JEWELLERY") {
      if (metalType === "GOLD") goldDelta = -fineWeight;
      if (metalType === "SILVER") silverDelta = -fineWeight;
      moneyDelta = +totalCashAmount;
    }

    // ── Build description ──────────────────────────────────────────────────
    const txLabel = type === "ISSUE_METAL" ? "Issue Metal" : "Receive Jewellery";
    let metalLabel = "Diamond";
    
    if (type === "ISSUE_METAL") {
       metalLabel = metalType === "GOLD" ? `Gold (${purityLabel || "24K"})` : `Silver (${purityLabel || "99.9%"})`;
    } else {
       if (metalType === "GOLD") metalLabel = `Gold (${purityLabel || "22K"})`;
       if (metalType === "SILVER") metalLabel = `Silver (${purityLabel || "92.5"}%)`;
    }

    const orderAssignDesc = orderIds.length > 0 ? ` [Assigned ${orderIds.length} Order(s)]` : "";
    const description = type === "ISSUE_METAL"
      ? `${txLabel} — ${metalLabel}, Wt: ${weightNum}g${orderAssignDesc}`
      : `${txLabel} — ${metalLabel}, Wt: ${weightNum}g, Wastage: ${wastageNum}%, Fine: ${fineWeight.toFixed(2)}g`;

    // ── Ledger entries ─────────────────────────────────────────────────────
    type LedgerCreate = {
      wholesalerId: string;
      entryType: string;
      metalAmount: number;
      cashAmount: number;
      description: string;
    };

    const ledgerData: LedgerCreate[] = [];

    if (goldDelta !== 0) {
      ledgerData.push({
        wholesalerId,
        entryType: type === "ISSUE_METAL" ? "GOLD_CREDIT" : "GOLD_DEBIT",
        metalAmount: Math.abs(goldDelta),
        cashAmount: 0,
        description,
      });
    }
    if (silverDelta !== 0) {
      ledgerData.push({
        wholesalerId,
        entryType: type === "ISSUE_METAL" ? "SILVER_CREDIT" : "SILVER_DEBIT",
        metalAmount: Math.abs(silverDelta),
        cashAmount: 0,
        description,
      });
    }
    if (moneyDelta !== 0) {
      ledgerData.push({
        wholesalerId,
        entryType: "MONEY_DEBIT",
        metalAmount: 0,
        cashAmount: moneyDelta,
        description: `Labor/Cash items for ${txLabel}`,
      });
    }

    // ── Prisma transaction ─────────────────────────────────────────────────
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the transaction record
      const transaction = await tx.wholesalerTransaction.create({
        data: {
          wholesalerId,
          type,
          metalType,
          purityLabel: String(purityLabel ?? ""),
          purityFactor,
          weight: weightNum,
          wastage: wastageNum,
          fineWeight: Number(fineWeight.toFixed(2)),
          totalCashAmount,
          remarks: remarks ?? null,
          cashItems: {
            create: items.map((i) => ({
              itemName: i.itemName,
              cost: Number(i.cost),
            })),
          },
          ledgerEntries: {
            create: ledgerData,
          },
        },
        include: { cashItems: true, ledgerEntries: true },
      });

      // 2. Update wholesaler balances
      const updated = await tx.wholesaler.update({
        where: { id: wholesalerId },
        data: {
          goldBal: { increment: goldDelta },
          silverBal: { increment: silverDelta },
          moneyBal: { increment: moneyDelta },
        },
      });

      // 3. Handle Order Status Updates
      if (type === "ISSUE_METAL" && orderIds.length > 0) {
        await tx.order.updateMany({
          where: { id: { in: orderIds } },
          data: {
            status: "ASSIGNED",
            wholesalerId: wholesalerId,
          },
        });
      }

      if (type === "RECEIVE_JEWELLERY" && receiveOrderDetails.length > 0) {
        const receivedOrderIds = receiveOrderDetails.map((r) => r.orderId);
        await tx.order.updateMany({
          where: { id: { in: receivedOrderIds } },
          data: {
            status: "COMPLETED",
          },
        });
      }

      // 4. Update Branch Inventory Ledger (Stock Deduction on Issue, Addition on Receive)
      let rawProduct = await tx.productItem.findFirst({ where: { name: "Old Gold Stock", branchId } });
      if (!rawProduct) {
        rawProduct = await tx.productItem.findFirst({ where: { branchId } });
      }


      if (type === "ISSUE_METAL" && rawProduct && weightNum > 0) {
        // Issue Raw Metal -> Deduct from Branch Free Fine Stock
        await tx.inventoryLedger.create({
          data: {
            productId: rawProduct.id,
            branchId,
            txnType: "KARIGAR_ISSUE_OUT",
            refType: "KARIGAR_JOB",
            refId: wholesalerId,
            qtyOut: 0,
            grossWeightOut: weightNum,
            fineWeightOut: fineWeight,
            remarks: `Issued metal to wholesaler ${wholesaler.name}`,
          },
        });
      } else if (type === "RECEIVE_JEWELLERY" && weightNum > 0) {
        // Receive Finished Jewellery from Wholesaler
        // Always creates ProductItems in UNMARKED JEWELLERY category

        // 1. Find or create UNMARKED JEWELLERY category
        let unmarkedCategory = await tx.category.findFirst({
          where: { branchId, name: { equals: "UNMARKED JEWELLERY", mode: "insensitive" } }
        });
        if (!unmarkedCategory) {
          unmarkedCategory = await tx.category.create({
            data: { name: "UNMARKED JEWELLERY", description: "Jewellery from Karigars and Wholesalers pending hallmarking", branchId }
          });
        }

        // 2. Find or create Wholesaler Received subcategory
        let wholesalerSubCat = await tx.subCategory.findFirst({
          where: { branchId, categoryId: unmarkedCategory.id, name: { contains: "Wholesaler", mode: "insensitive" } }
        });
        if (!wholesalerSubCat) {
          wholesalerSubCat = await tx.subCategory.create({
            data: { name: "Wholesaler Received Jewellery", categoryId: unmarkedCategory.id, branchId }
          });
        }

        if (receiveOrderDetails.length > 0) {
          // Create one ProductItem per received order detail
          for (const rd of receiveOrderDetails) {
            const rdOrder = await tx.order.findUnique({
              where: { id: rd.orderId },
              select: { orderNumber: true, customerName: true }
            });
            const orderLabel = rdOrder
              ? `${rdOrder.orderNumber} (${rdOrder.customerName})`
              : rd.orderId.slice(-6).toUpperCase();
            const uniqueCode = `WJ-${wholesalerId.slice(-5).toUpperCase()}-${rd.orderId.slice(-5).toUpperCase()}-${Date.now().toString().slice(-4)}`;
            const purityPct = rd.purityLabel === "22K" ? 92
              : rd.purityLabel === "20K" ? 83
              : rd.purityLabel === "18K" ? 75
              : rd.purityLabel === "14K" ? 58
              : rd.purityLabel === "9K"  ? 37
              : 92; // default 22K

            const createdProduct = await tx.productItem.create({
              data: {
                name: `Unmarked ${rd.purityLabel || "22K"} Jewellery (${wholesaler.name})`,
                productCode: uniqueCode,
                barcode: uniqueCode,
                gsWeight: rd.netWeight,
                ntWeight: rd.netWeight,
                purity: purityPct,
                quantity: 1,
                allowNegativeStock: true,
                branchId,
                subCategoryId: wholesalerSubCat.id,
                description: `Received from wholesaler ${wholesaler.name} for order ${orderLabel}`,
              }
            });

            await tx.inventoryLedger.create({
              data: {
                productId: createdProduct.id,
                branchId,
                txnType: "KARIGAR_RECEIVE_IN",
                refType: "KARIGAR_JOB",
                refId: wholesalerId,
                qtyIn: 1,
                grossWeightIn: rd.netWeight,
                netWeightIn: rd.netWeight,
                fineWeightIn: rd.fineWeight,
                purityPercent: purityPct,
                remarks: `Wholesaler received: ${wholesaler.name} — Order ${orderLabel}`,
              }
            });
          }
        } else {
          // Fallback: no order details — create a batch product for the entire receipt
          const batchCode = `WJ-${wholesalerId.slice(-5).toUpperCase()}-BATCH-${Date.now().toString().slice(-6)}`;
          const purityPct = purityLabel === "22K" ? 92
            : purityLabel === "20K" ? 83
            : purityLabel === "18K" ? 75
            : purityLabel === "14K" ? 58
            : 92;

          const createdProduct = await tx.productItem.create({
            data: {
              name: `Unmarked ${purityLabel || "22K"} Jewellery (${wholesaler.name})`,
              productCode: batchCode,
              barcode: batchCode,
              gsWeight: weightNum,
              ntWeight: weightNum,
              purity: purityPct,
              quantity: 1,
              allowNegativeStock: true,
              branchId,
              subCategoryId: wholesalerSubCat.id,
              description: `Batch received from wholesaler ${wholesaler.name}. Wt: ${weightNum}g, Purity: ${purityLabel || "22K"}`,
            }
          });

          await tx.inventoryLedger.create({
            data: {
              productId: createdProduct.id,
              branchId,
              txnType: "KARIGAR_RECEIVE_IN",
              refType: "KARIGAR_JOB",
              refId: wholesalerId,
              qtyIn: 1,
              grossWeightIn: weightNum,
              netWeightIn: weightNum,
              fineWeightIn: fineWeight,
              purityPercent: purityPct,
              remarks: `Batch received from wholesaler ${wholesaler.name}`,
            }
          });
        }
      }

      return { transaction, updated };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[WHOLESALER TRANSACTION POST]", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

// ─── GET ─ Fetch all ledger entries for a wholesaler ─────────────────────────
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: wholesalerId } = await context.params;

    const entries = await prisma.wholesalerLedgerEntry.findMany({
      where: { wholesalerId },
      include: {
        transaction: {
          include: { cashItems: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("[WHOLESALER LEDGER GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch ledger" },
      { status: 500 }
    );
  }
}
