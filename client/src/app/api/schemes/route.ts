import { NextResponse } from "next/server";
import { prisma } from "../../../../libs/prisma";

// GET /api/schemes?branchId=1&status=ACTIVE&type=FIXED_MONTHLY&search=...&page=1&limit=20
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = Number(searchParams.get("branchId"));
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search") || "";
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");

    if (!branchId) {
      return NextResponse.json({ error: "Branch ID required" }, { status: 400 });
    }

    const where: any = { branchId };

    if (status) where.status = status;
    if (type) where.type = type;
    if (search.trim()) {
      where.OR = [
        { schemeNumber: { contains: search.trim(), mode: "insensitive" } },
        { physicalCardNumber: { contains: search.trim(), mode: "insensitive" } },
        { customer: { name: { contains: search.trim(), mode: "insensitive" } } },
        { customer: { mobile: { contains: search.trim() } } },
      ];
    }

    const [schemes, total] = await Promise.all([
      prisma.savingScheme.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, mobile: true } },
          _count: { select: { deposits: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.savingScheme.count({ where }),
    ]);

    // Stats
    const stats = await prisma.savingScheme.aggregate({
      where: { branchId },
      _count: { id: true },
      _sum: { totalCashDeposited: true, totalGoldDepositedGm: true, totalBonusAmount: true },
    });

    const activeCount = await prisma.savingScheme.count({ where: { branchId, status: "ACTIVE" } });
    const maturedCount = await prisma.savingScheme.count({ where: { branchId, status: "MATURED" } });

    // Deposits this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const depositsThisMonth = await prisma.schemeDeposit.aggregate({
      where: {
        scheme: { branchId },
        depositedAt: { gte: startOfMonth },
        isBonus: false,
        depositType: { not: "BONUS" }
      },
      _sum: { cashAmount: true },
      _count: { id: true },
    });

    // Active Value Stats
    const activeStats = await prisma.savingScheme.aggregate({
      where: { branchId, status: { in: ["ACTIVE", "MATURED", "PARTIALLY_REDEEMED"] } },
      _sum: { totalCashDeposited: true, totalBonusAmount: true, totalRedeemed: true, totalGoldDepositedGm: true },
    });
    
    const totalActiveValue = (activeStats._sum.totalCashDeposited || 0) + (activeStats._sum.totalBonusAmount || 0) - (activeStats._sum.totalRedeemed || 0);
    const activeMetalHolding = activeStats._sum.totalGoldDepositedGm || 0;

    return NextResponse.json({
      schemes,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      stats: {
        totalSchemes: stats._count.id,
        activeSchemes: activeCount,
        maturedSchemes: maturedCount,
        totalCashDeposited: stats._sum.totalCashDeposited || 0,
        totalGoldDeposited: stats._sum.totalGoldDepositedGm || 0,
        totalBonusGiven: stats._sum.totalBonusAmount || 0,
        depositsThisMonth: depositsThisMonth._count.id,
        depositAmountThisMonth: depositsThisMonth._sum.cashAmount || 0,
        totalActiveValue,
        activeMetalHolding,
      },
    });
  } catch (error: any) {
    console.error("Error fetching schemes:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/schemes — Create a new scheme
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customerId,
      branchId,
      type,
      fixedMonthlyAmount,
      maxDurationMonths,
      physicalCardNumber,
      createdById,
    } = body;

    if (!customerId || !branchId || !type) {
      return NextResponse.json(
        { error: "customerId, branchId, and type are required" },
        { status: 400 }
      );
    }

    // Fetch branch scheme config
    const branchSettings = await prisma.globalProductSettings.findUnique({
      where: { branchId: Number(branchId) },
      select: { schemeConfig: true },
    });
    
    const defaultConfig = {
      allowedTypes: ["FIXED_MONTHLY", "ANONYMOUS_DEPOSIT", "GOLD_DEPOSIT"],
      fixedMonthly: { minDeposit: 1000, maxDeposit: 50000, durations: [12, 24] },
    };
    
    const config = branchSettings?.schemeConfig 
      ? { ...defaultConfig, ...(branchSettings.schemeConfig as any) }
      : defaultConfig;

    if (!config.allowedTypes?.includes(type)) {
      return NextResponse.json(
        { error: "This scheme type is currently disabled for this branch" },
        { status: 400 }
      );
    }

    // Validate type-specific fields
    if (type === "FIXED_MONTHLY") {
      const minAmount = config.fixedMonthly?.minDeposit || 1000;
      const maxAmount = config.fixedMonthly?.maxDeposit || 50000;
      
      if (!fixedMonthlyAmount || fixedMonthlyAmount < minAmount || fixedMonthlyAmount > maxAmount) {
        return NextResponse.json(
          { error: `Fixed monthly amount must be between ₹${minAmount} and ₹${maxAmount}` },
          { status: 400 }
        );
      }

      const durations = config.fixedMonthly?.durations || [12, 24];
      if (!durations.includes(maxDurationMonths)) {
        return NextResponse.json(
          { error: `Invalid duration selected. Allowed durations: ${durations.join(", ")} months` },
          { status: 400 }
        );
      }
    }

    // Generate scheme number: SCH-XXXXXX
    const lastScheme = await prisma.savingScheme.findFirst({
      orderBy: { createdAt: "desc" },
      select: { schemeNumber: true },
    });

    let nextNum = 1;
    if (lastScheme?.schemeNumber) {
      const match = lastScheme.schemeNumber.match(/SCH-(\d+)/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    const schemeNumber = `SCH-${String(nextNum).padStart(6, "0")}`;

    // Calculate maturity date
    const startDate = new Date();
    const duration = maxDurationMonths || (type === "FIXED_MONTHLY" ? 12 : 12);
    const maturityDate = new Date(startDate);
    maturityDate.setMonth(maturityDate.getMonth() + duration);

    const scheme = await prisma.savingScheme.create({
      data: {
        schemeNumber,
        type,
        customerId: Number(customerId),
        branchId: Number(branchId),
        createdById: createdById ? Number(createdById) : null,
        fixedMonthlyAmount: type === "FIXED_MONTHLY" ? Number(fixedMonthlyAmount) : null,
        maxDurationMonths: duration,
        startDate,
        maturityDate,
        physicalCardNumber: physicalCardNumber || null,
        cardIssuedAt: physicalCardNumber ? new Date() : null,
      },
      include: {
        customer: { select: { id: true, name: true, mobile: true } },
      },
    });

    return NextResponse.json({ success: true, scheme });
  } catch (error: any) {
    console.error("Error creating scheme:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A scheme with this card number already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
