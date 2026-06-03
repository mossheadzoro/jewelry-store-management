import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;
    
    // Filter by tier
    const tier = searchParams.get("tier"); // ALL, ELITE, VIP, HIGH_VALUE, WHOLESALE
    
    const validTags = ["ELITE", "VIP", "HIGH_VALUE"];
    let tagFilter = validTags;
    if (tier && validTags.includes(tier)) {
      tagFilter = [tier];
    }
    
    // 1. Fetch Customers with those tags
    const whereClause: any = {};
    if (tier !== "WHOLESALE") {
      whereClause.tags = {
        some: {
          tagDefinition: {
            name: { in: tagFilter },
          },
        },
      };
    } else {
      // If wholesale tab is selected, we could query wholesalers, but for simplicity
      // let's say no customers match WHOLESALE tag if it's not implemented on Customer.
      whereClause.id = -1; // Dummy fail unless we implement Wholesale customers
    }

    // If tier is ALL, we want to include Wholesale? For now, we focus on Customers.
    if (tier === "ALL") {
      whereClause.tags = {
        some: {
          tagDefinition: {
            name: { in: validTags },
          },
        },
      };
    }

    const totalCustomers = await prisma.customer.count({ where: whereClause });
    
    const customersRaw = await prisma.customer.findMany({
      where: whereClause,
      include: {
        tags: {
          include: { tagDefinition: true }
        },
        invoices: {
          select: { totalAmount: true, balanceAmount: true, isFullyPaid: true, createdAt: true, items: { include: { product: true } } }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" }
    });

    // 2. Format customer data for the cards
    const formattedCustomers = customersRaw.map(c => {
      const lifetimeValue = c.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const outstanding = c.invoices.filter(inv => !inv.isFullyPaid).reduce((sum, inv) => sum + inv.balanceAmount, 0);
      
      const tags = c.tags.map(t => t.tagDefinition.name);
      let loyaltyTier = "REGULAR";
      if (tags.includes("ELITE")) loyaltyTier = "ELITE";
      else if (tags.includes("VIP")) loyaltyTier = "VIP";
      else if (tags.includes("HIGH_VALUE")) loyaltyTier = "HIGH_VALUE";

      const lastPurchaseDate = c.invoices.length > 0 
        ? new Date(Math.max(...c.invoices.map(inv => new Date(inv.createdAt).getTime())))
        : null;

      // Mock preferred metal
      const preferredMetal = "22K Gold & Solitaires";
      
      // Mock RFM score (between 12 and 15)
      const rfmScore = 12 + (c.id % 4);

      return {
        id: c.id,
        name: c.name,
        joinDate: c.createdAt,
        rfmScore,
        lifetimeValue,
        preferredMetal,
        lastInteraction: lastPurchaseDate ? "Last purchase " + lastPurchaseDate.toLocaleDateString() : "No purchases",
        outstanding,
        loyaltyTier
      };
    });

    // 3. Calculate Stats
    // We will do some fast queries to count tags.
    const getCountByTag = async (tagName: string) => {
      return await prisma.customer.count({
        where: { tags: { some: { tagDefinition: { name: tagName } } } }
      });
    };

    const eliteCount = await getCountByTag("ELITE");
    const vipCount = await getCountByTag("VIP");
    const highValueCount = await getCountByTag("HIGH_VALUE");
    const wholesaleCount = await prisma.wholesaler.count({ where: { isActive: true } });

    // For quarterly rev, we just mock or calculate a fraction of lifetime.
    // In a real scenario we would aggregate. We'll provide some realistic dummy values based on counts.

    const stats = {
      elite: {
        count: eliteCount,
        active: eliteCount,
        quarterlyRev: `₹ ${(eliteCount * 2.5).toFixed(1)} Cr`,
        avgSpend: `₹ 25.0L`
      },
      vip: {
        count: vipCount,
        active: vipCount,
        quarterlyRev: `₹ ${(vipCount * 1.5).toFixed(1)} Cr`,
        avgSpend: `₹ 12.0L`
      },
      highValue: {
        count: highValueCount,
        active: highValueCount,
        quarterlyRev: `₹ ${(highValueCount * 0.8).toFixed(1)} Cr`,
        avgSpend: `₹ 6.5L`
      },
      wholesale: {
        count: wholesaleCount,
        active: wholesaleCount,
        quarterlyRev: `₹ ${(wholesaleCount * 4.2).toFixed(1)} Cr`,
        avgVol: `2.5kg`
      }
    };

    return NextResponse.json({
      customers: formattedCustomers,
      stats,
      pagination: {
        page,
        limit,
        total: totalCustomers,
        totalPages: Math.ceil(totalCustomers / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching VIP customers:", error);
    return NextResponse.json({ error: "Failed to fetch VIP customers" }, { status: 500 });
  }
}
