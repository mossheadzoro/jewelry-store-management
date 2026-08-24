import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET Stock Ledger API
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const productId = searchParams.get("productId");
    const txnType = searchParams.get("txnType");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const metricFilter = searchParams.get("metricFilter");

    const where: any = {};

    if (branchId) where.branchId = parseInt(branchId);
    if (productId) where.productId = parseInt(productId);
    if (txnType && txnType !== "ALL") where.txnType = txnType;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo + "T23:59:59.999Z");
    }

    if (metricFilter === "qtyIn") {
      where.qtyIn = { gt: 0 };
    } else if (metricFilter === "qtyOut") {
      where.qtyOut = { gt: 0 };
    } else if (metricFilter === "jewelleryIn") {
      where.netWeightIn = { gt: 0 };
      if (!where.txnType) where.txnType = { notIn: ["OLD_GOLD_IN", "KARIGAR_ISSUE_OUT"] };
    } else if (metricFilter === "jewelleryOut") {
      where.netWeightOut = { gt: 0 };
      if (!where.txnType) where.txnType = { notIn: ["OLD_GOLD_IN", "KARIGAR_ISSUE_OUT"] };
    } else if (metricFilter === "fineIn") {
      where.fineWeightIn = { gt: 0 };
      if (!where.txnType) where.txnType = { notIn: ["PURCHASE_IN", "SALE_OUT", "KARIGAR_RECEIVE_IN"] };
    } else if (metricFilter === "fineOut") {
      where.fineWeightOut = { gt: 0 };
      if (!where.txnType) where.txnType = { notIn: ["PURCHASE_IN", "SALE_OUT", "KARIGAR_RECEIVE_IN"] };
    }

    const [entries, total] = await Promise.all([
      prisma.inventoryLedger.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              barcode: true,
              productCode: true,
              image: true,
              subCategory: { select: { name: true, category: { select: { name: true } } } },
            },
          },
          branch: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.inventoryLedger.count({ where }),
    ]);

    // Enhance entries with booking details if refType is ORDER
    const bookingIds = entries.filter((e: any) => e.refType === "ORDER" && e.refId).map((e: any) => e.refId);
    if (bookingIds.length > 0) {
      const bookings = await prisma.productBooking.findMany({
        where: { id: { in: bookingIds } },
        select: { id: true, bookingNumber: true, Customer: { select: { name: true } } }
      });
      const bookingMap = new Map(bookings.map((b: any) => [b.id, b]));
      
      entries.forEach((e: any) => {
        if (e.refType === "ORDER" && e.refId && bookingMap.has(e.refId)) {
          const b: any = bookingMap.get(e.refId);
          e.refDetails = `${b.bookingNumber} (${b.Customer?.name || "Customer"})`;
        }
      });
    }

    if (metricFilter) {
      return NextResponse.json({
        entries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      });
    }

    // Summary aggregation
    const summary = await prisma.inventoryLedger.aggregate({
      where,
      _sum: {
        qtyIn: true,
        qtyOut: true,
        grossWeightIn: true,
        grossWeightOut: true,
        netWeightIn: true,
        netWeightOut: true,
        fineWeightIn: true,
        fineWeightOut: true,
        totalValue: true,
      },
    });

    // Jewellery specific net weight (Exclude Raw Metal Transactions)
    const jewellerySummary = await prisma.inventoryLedger.aggregate({
      where: {
        ...where,
        txnType: { notIn: ["OLD_GOLD_IN", "KARIGAR_ISSUE_OUT"] }
      },
      _sum: {
        netWeightIn: true,
        netWeightOut: true,
      }
    });

    // Raw metal specific fine weight (Exclude Jewellery Transactions)
    const rawFineSummary = await prisma.inventoryLedger.aggregate({
      where: {
        ...where,
        txnType: { notIn: ["PURCHASE_IN", "SALE_OUT", "KARIGAR_RECEIVE_IN"] }
      },
      _sum: {
        fineWeightIn: true,
        fineWeightOut: true,
      }
    });

    // Enhance entries block removed from here as it's done before early return

    // Active Inventory Jewellery Weights by Category for that Branch
    const branchIdNum = branchId ? parseInt(branchId, 10) : undefined;

    // Free Fine Weight (Idle 24K metal available in branch ready for Karigar / Wholesaler)
    const freeFineAgg = await prisma.inventoryLedger.aggregate({
      where: {
        ...(branchIdNum ? { branchId: branchIdNum } : {}),
        OR: [
          { refType: "METAL_EXCHANGE" },
          { txnType: "OLD_GOLD_IN" },
          { txnType: "KARIGAR_ISSUE_OUT" },
          { txnType: "TRANSFER_OUT" },
          { txnType: "OPENING" }
        ]
      },
      _sum: {
        fineWeightIn: true,
        fineWeightOut: true,
      }
    });
    const freeFineWeight = Math.max(0, (freeFineAgg._sum.fineWeightIn || 0) - (freeFineAgg._sum.fineWeightOut || 0));

    // Unmarked Jewellery From Karigar & Wholesaler Metrics
    const unmarkedAgg = await prisma.inventoryLedger.aggregate({
      where: {
        ...(branchIdNum ? { branchId: branchIdNum } : {}),
        product: {
          subCategory: {
            category: { name: { equals: "UNMARKED JEWELLERY", mode: "insensitive" } }
          }
        }
      },
      _sum: {
        netWeightIn: true,
        netWeightOut: true,
        fineWeightIn: true,
        fineWeightOut: true
      }
    });
    const unmarkedNetWeight = Math.max(0, (unmarkedAgg._sum.netWeightIn || 0) - (unmarkedAgg._sum.netWeightOut || 0));
    const unmarkedFineWeight = Math.max(0, (unmarkedAgg._sum.fineWeightIn || 0) - (unmarkedAgg._sum.fineWeightOut || 0));

    // Stamping Center Metrics
    const stampingAgg = await prisma.inventoryLedger.aggregate({
      where: {
        ...(branchIdNum ? { branchId: branchIdNum } : {}),
        product: {
          subCategory: {
            category: { name: { equals: "STAMPING CENTER", mode: "insensitive" } }
          }
        }
      },
      _sum: {
        netWeightIn: true,
        netWeightOut: true,
        fineWeightIn: true,
        fineWeightOut: true
      }
    });
    const stampingNetWeight = stampingAgg._sum.netWeightIn || 0;
    const stampingFineWeight = stampingAgg._sum.fineWeightIn || 0;

    // Fetch detailed unmarked jewellery entries for modal (last 100)
    const unmarkedEntries = await prisma.inventoryLedger.findMany({
      where: {
        ...(branchIdNum ? { branchId: branchIdNum } : {}),
        txnType: "KARIGAR_RECEIVE_IN",
        product: {
          subCategory: {
            category: { name: { equals: "UNMARKED JEWELLERY", mode: "insensitive" } }
          }
        }
      },
      include: {
        product: {
          select: {
            id: true, name: true, productCode: true, description: true, purity: true, ntWeight: true,
            subCategory: { select: { name: true, category: { select: { name: true } } } }
          }
        },
        branch: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    // Fetch detailed stamping center entries for modal (last 100)
    const stampingEntries = await prisma.inventoryLedger.findMany({
      where: {
        ...(branchIdNum ? { branchId: branchIdNum } : {}),
        txnType: "HALLMARK_OUT",
        product: {
          subCategory: {
            category: { name: { equals: "STAMPING CENTER", mode: "insensitive" } }
          }
        }
      },
      include: {
        product: {
          select: {
            id: true, name: true, productCode: true, description: true, purity: true, ntWeight: true, gsWeight: true, image: true, stoneDetails: true,
            subCategory: { select: { name: true, category: { select: { name: true } } } }
          }
        },
        branch: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    const branchCategories = await prisma.category.findMany({
      where: branchIdNum ? { branchId: branchIdNum } : {},
      select: { 
        id: true, 
        name: true, 
        branchId: true,
        subCategories: { select: { id: true, name: true } }
      },
      orderBy: { name: "asc" }
    });

    const activeProducts = await prisma.productItem.findMany({
      where: {
        ...(branchIdNum ? { branchId: branchIdNum } : {}),
        quantity: { gt: 0 }
      },
      select: {
        ntWeight: true,
        subCategory: {
          select: {
            category: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    const catMap = new Map<string, number>();
    branchCategories.forEach((cat) => {
      catMap.set(cat.name, 0);
    });

    let netGoldJewelleryWt = 0;
    let netSilverJewelleryWt = 0;
    let netDiamondJewelleryWt = 0;

    activeProducts.forEach((p: any) => {
      const categoryObj = p.subCategory?.category;
      const rawName = categoryObj?.name || "Uncategorized";
      const currentWt = catMap.get(rawName) || 0;
      catMap.set(rawName, currentWt + (p.ntWeight || 0));

      const lowerName = rawName.toLowerCase();
      if (lowerName.includes("silver")) {
        netSilverJewelleryWt += p.ntWeight || 0;
      } else if (lowerName.includes("diamond") || lowerName.includes("stone")) {
        netDiamondJewelleryWt += p.ntWeight || 0;
      } else {
        netGoldJewelleryWt += p.ntWeight || 0;
      }
    });

    const categoryWeights = Array.from(catMap.entries()).map(([name, netWeight]) => ({
      name,
      netWeight: Number(netWeight.toFixed(3)),
    }));

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalQtyIn: summary._sum.qtyIn || 0,
        totalQtyOut: summary._sum.qtyOut || 0,
        totalGrossWtIn: summary._sum.grossWeightIn || 0,
        totalGrossWtOut: summary._sum.grossWeightOut || 0,
        totalNetWtIn: jewellerySummary._sum.netWeightIn || 0,
        totalNetWtOut: jewellerySummary._sum.netWeightOut || 0,
        totalFineWtIn: rawFineSummary._sum.fineWeightIn || 0,
        totalFineWtOut: rawFineSummary._sum.fineWeightOut || 0,
        liveNetFineWeight: Math.max(0, (rawFineSummary._sum.fineWeightIn || 0) - (rawFineSummary._sum.fineWeightOut || 0)),
        freeFineWeight,
        unmarkedKarigarJewellery: {
          netWeight: Number(unmarkedNetWeight.toFixed(3)),
          fineWeight: Number(unmarkedFineWeight.toFixed(3)),
          entries: unmarkedEntries,
        },
        stampingCenter: {
          netWeight: Number(stampingNetWeight.toFixed(3)),
          fineWeight: Number(stampingFineWeight.toFixed(3)),
          entries: stampingEntries,
        },
        categoryWeights,
        netGoldJewelleryWt,
        netSilverJewelleryWt,
        netDiamondJewelleryWt,
        totalValue: summary._sum.totalValue || 0,
      },
    });
  } catch (error: any) {
    console.error("Ledger fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch ledger" }, { status: 500 });
  }
}
