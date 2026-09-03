import { prisma } from "@/lib/prisma";
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subWeeks,
  subMonths,
  subQuarters,
  subYears,
  format,
} from "date-fns";


export async function getDashboardData(
  branchId: number | null,
  dateRange: string = "today",
  trendTimeframe: string = "90d"
) {
  const now = new Date();
  let startDate = startOfDay(now);
  let endDate = endOfDay(now);
  let prevStartDate = startOfDay(subDays(now, 1));
  let prevEndDate = endOfDay(subDays(now, 1));

  switch (dateRange) {
    case "week":
      startDate = startOfWeek(now);
      prevStartDate = startOfWeek(subWeeks(now, 1));
      prevEndDate = endOfDay(subWeeks(now, 1));
      break;
    case "month":
      startDate = startOfMonth(now);
      prevStartDate = startOfMonth(subMonths(now, 1));
      prevEndDate = endOfDay(subMonths(now, 1));
      break;
    case "quarter":
      startDate = startOfQuarter(now);
      prevStartDate = startOfQuarter(subQuarters(now, 1));
      prevEndDate = endOfDay(subQuarters(now, 1));
      break;
    case "year":
      startDate = startOfYear(now);
      prevStartDate = startOfYear(subYears(now, 1));
      prevEndDate = endOfDay(subYears(now, 1));
      break;
  }

  // Trend date filter for Trending Designs and Frequently Ordered
  let trendStartDate: Date;
  switch (trendTimeframe) {
    case "30d":
      trendStartDate = startOfDay(subDays(now, 30));
      break;
    case "90d":
      trendStartDate = startOfDay(subDays(now, 90));
      break;
    case "180d":
      trendStartDate = startOfDay(subDays(now, 180));
      break;
    case "all":
      trendStartDate = new Date(2020, 0, 1);
      break;
    case "today":
      trendStartDate = startOfDay(now);
      break;
    case "week":
      trendStartDate = startOfWeek(now);
      break;
    case "month":
      trendStartDate = startOfMonth(now);
      break;
    default:
      trendStartDate = startOfDay(subDays(now, 90));
  }

  const branchFilter = branchId ? { branchId } : {};

  // Determine chart range start
  const numDays = dateRange === "week" ? 7 : dateRange === "month" ? 30 : dateRange === "year" ? 12 : 7;
  const chartStartDate = startOfDay(subDays(now, dateRange === "month" ? 29 : dateRange === "year" ? 364 : 6));

  // --- 1. PROMISES FOR CORE METRICS ---
  // Sales: Sum of totalAmount, totalMakingAmount, totalMetalAmount, taxOnGold, cgst, sgst
  const pCurrentSales = prisma.invoice.aggregate({
    where: { ...branchFilter, createdAt: { gte: startDate, lte: endDate } },
    _sum: {
      totalAmount: true,
      totalMakingAmount: true,
      totalMetalAmount: true,
      taxOnGold: true,
      cgst: true,
      sgst: true,
      hallmarkingCharge: true,
    },
    _count: { _all: true },
  });

  const pPrevSales = prisma.invoice.aggregate({
    where: { ...branchFilter, createdAt: { gte: prevStartDate, lte: prevEndDate } },
    _sum: {
      totalAmount: true,
      totalMakingAmount: true,
      taxOnGold: true,
      cgst: true,
      sgst: true,
    },
    _count: { _all: true },
  });

  const pCurrentOrders = prisma.order.count({
    where: { ...branchFilter, createdAt: { gte: startDate, lte: endDate } },
  });

  const pPrevOrders = prisma.order.count({
    where: { ...branchFilter, createdAt: { gte: prevStartDate, lte: prevEndDate } },
  });

  const pCurrentInvoiceItems = prisma.invoiceItem.aggregate({
    where: { invoice: { ...branchFilter, createdAt: { gte: startDate, lte: endDate } } },
    _sum: { gsWeight: true, ntWeight: true },
  });

  const pPrevInvoiceItems = prisma.invoiceItem.aggregate({
    where: { invoice: { ...branchFilter, createdAt: { gte: prevStartDate, lte: prevEndDate } } },
    _sum: { gsWeight: true },
  });

  // Purchase GST & Input Tax Credit (ITC) for selected filter period
  const pCurrentPurchaseGst = prisma.purchaseGSTRecord.aggregate({
    where: {
      ...branchFilter,
      createdAt: { gte: startDate, lte: endDate },
    },
    _sum: {
      totalTax: true,
      cgst: true,
      sgst: true,
      igst: true,
      itcClaimedAmount: true,
    },
  });

  const pPrevPurchaseGst = prisma.purchaseGSTRecord.aggregate({
    where: {
      ...branchFilter,
      createdAt: { gte: prevStartDate, lte: prevEndDate },
    },
    _sum: {
      totalTax: true,
      cgst: true,
      sgst: true,
      igst: true,
      itcClaimedAmount: true,
    },
  });

  // Inventory basic counts
  const pAvailableItems = prisma.productItem.count({
    where: { ...branchFilter, quantity: { gt: 0 } },
  });

  const pReservedItems = prisma.productItem.count({
    where: { ...branchFilter, reservedQty: { gt: 0 } },
  });

  const pTransfersPending = prisma.inventoryTransfer.count({
    where: {
      status: "PENDING",
      OR: [{ fromBranchId: branchId || undefined }, { toBranchId: branchId || undefined }],
    },
  });

  // Subcategory inventory items query for Subcategory-level Low Stock & Out of Stock calculation
  const pSubCategoryInventory = prisma.subCategory.findMany({
    include: {
      category: { select: { id: true, name: true } },
      products: {
        where: { ...branchFilter },
        select: {
          id: true,
          name: true,
          barcode: true,
          productCode: true,
          quantity: true,
          gsWeight: true,
          purity: true,
          image: true,
        },
      },
    },
  });

  // Slow Moving Inventory: Active inventory items with quantity > 0 and no sales or created long ago
  const pSlowMovingInventory = prisma.productItem.findMany({
    where: {
      ...branchFilter,
      quantity: { gt: 0 },
    },
    select: {
      id: true,
      name: true,
      barcode: true,
      productCode: true,
      gsWeight: true,
      purity: true,
      quantity: true,
      image: true,
      createdAt: true,
      subCategory: {
        select: {
          name: true,
          category: { select: { name: true } },
        },
      },
      invoiceItems: {
        select: { id: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
    take: 60,
  });

  // Customer metrics
  const pNewCustomers = prisma.customer.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } },
    select: {
      id: true,
      name: true,
      mobile: true,
      email: true,
      city: true,
      customerGroup: true,
      createdAt: true,
      walletBalance: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const pVipCustomers = prisma.customer.findMany({
    where: {
      tags: {
        some: {
          tagDefinition: {
            name: { contains: "VIP", mode: "insensitive" },
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      mobile: true,
      email: true,
      city: true,
      customerGroup: true,
      walletBalance: true,
      createdAt: true,
      _count: { select: { invoices: true, Order: true } },
    },
    take: 50,
  });

  // Customers for Birthday and Anniversary (check matching day & month in memory)
  const pAllCustomerCelebrations = prisma.customer.findMany({
    where: {
      OR: [{ dob: { not: null } }, { anniversary: { not: null } }],
    },
    select: {
      id: true,
      name: true,
      mobile: true,
      email: true,
      city: true,
      dob: true,
      anniversary: true,
      customerGroup: true,
    },
  });

  // Workshop & Orders metrics
  const pPendingOrders = prisma.order.count({
    where: { ...branchFilter, status: { in: ["CREATED", "ASSIGNED", "IN_PROGRESS"] } },
  });

  const pUrgentOrders = prisma.order.count({
    where: {
      ...branchFilter,
      priority: { in: ["URGENT", "RUSH"] },
      status: { notIn: ["DELIVERED", "CANCELLED", "RETURNED"] },
    },
  });

  const pOverdueOrders = prisma.order.count({
    where: {
      ...branchFilter,
      deliveryDate: { lt: now },
      status: { notIn: ["DELIVERED", "CANCELLED", "RETURNED"] },
    },
  });

  const pTodayDeliveries = prisma.order.count({
    where: {
      ...branchFilter,
      deliveryDate: { gte: startOfDay(now), lte: endOfDay(now) },
    },
  });

  const pKarigarBusy = prisma.karigar.count({ where: { isActive: true } });

  // Workshop active jobs list for modal
  const pWorkshopOrdersList = prisma.order.findMany({
    where: {
      ...branchFilter,
      status: { notIn: ["DELIVERED", "CANCELLED", "RETURNED"] },
    },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerMobile: true,
      status: true,
      priority: true,
      orderDate: true,
      deliveryDate: true,
      notes: true,
      karigar: { select: { id: true, name: true, phoneNumber: true } },
      items: {
        select: {
          id: true,
          description: true,
          weight: true,
          category: { select: { name: true } },
        },
      },
    },
    orderBy: { deliveryDate: "asc" },
    take: 50,
  });

  // Finance & Payments
  const pPayments = prisma.invoicePayment.groupBy({
    by: ["method"],
    where: { invoice: { ...branchFilter, createdAt: { gte: startDate, lte: endDate } } },
    _sum: { amount: true },
  });

  // Outstanding Invoices & list for modal
  const pOutstandingInvoicesList = prisma.invoice.findMany({
    where: { ...branchFilter, isFullyPaid: false, balanceAmount: { gt: 0 } },
    select: {
      id: true,
      invoiceNumber: true,
      totalAmount: true,
      paidAmount: true,
      balanceAmount: true,
      createdAt: true,
      customer: { select: { id: true, name: true, mobile: true, city: true } },
    },
    orderBy: { balanceAmount: "desc" },
    take: 50,
  });

  // Advances from BookingAdvance and Order Advance
  const pBookingAdvancesList = prisma.bookingAdvance.findMany({
    where: { ...branchFilter, createdAt: { gte: startDate, lte: endDate } },
    select: {
      id: true,
      bookingId: true,
      advanceType: true,
      cashAmount: true,
      netValue: true,
      paymentRef: true,
      createdAt: true,
      ProductBooking: {
        select: {
          bookingNumber: true,
          Customer: { select: { id: true, name: true, mobile: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const pOrderAdvancesList = prisma.advance.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      ...(branchId ? { order: { branchId } } : {}),
    },
    select: {
      id: true,
      advanceReceiptNumber: true,
      moneyAmount: true,
      paymentMethod: true,
      paymentRef: true,
      createdAt: true,
      customer: { select: { id: true, name: true, mobile: true } },
      order: { select: { orderNumber: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Category & Subcategory detailed sales
  const pInvoiceItemsList = prisma.invoiceItem.findMany({
    where: { invoice: { ...branchFilter, createdAt: { gte: startDate, lte: endDate } } },
    select: {
      totalAfterTax: true,
      quantity: true,
      gsWeight: true,
      product: {
        select: {
          name: true,
          subCategory: {
            select: {
              id: true,
              name: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
    take: 600,
  });

  // Trending Designs Query (based on trendTimeframe)
  const pTrendingInvoiceItems = prisma.invoiceItem.findMany({
    where: { invoice: { ...branchFilter, createdAt: { gte: trendStartDate } } },
    select: {
      quantity: true,
      totalAfterTax: true,
      product: {
        select: {
          name: true,
          productCode: true,
          subCategory: {
            select: {
              name: true,
              category: { select: { name: true } },
            },
          },
        },
      },
    },
    take: 1000,
  });

  // Frequently Ordered items from OrderItem (based on trendTimeframe)
  const pFrequentlyOrderedItems = prisma.orderItem.findMany({
    where: { order: { ...branchFilter, createdAt: { gte: trendStartDate } } },
    select: {
      description: true,
      category: { select: { name: true } },
    },
    take: 500,
  });

  // Time-series Chart Invoices
  const pChartInvoices = prisma.invoice.findMany({
    where: { ...branchFilter, createdAt: { gte: chartStartDate, lte: endDate } },
    select: { createdAt: true, totalAmount: true },
  });

  // Branch comparison query (all branches)
  const pBranches = prisma.branch.findMany({ select: { id: true, name: true, city: true } });

  const pBranchSalesGroup = prisma.invoice.groupBy({
    by: ["branchId"],
    where: { createdAt: { gte: startDate, lte: endDate } },
    _sum: { totalAmount: true, totalMakingAmount: true },
    _count: { _all: true },
  });

  const pBranchPrevSalesGroup = prisma.invoice.groupBy({
    by: ["branchId"],
    where: { createdAt: { gte: prevStartDate, lte: prevEndDate } },
    _sum: { totalAmount: true },
  });

  const pBranchOrdersGroup = prisma.order.groupBy({
    by: ["branchId"],
    where: { createdAt: { gte: startDate, lte: endDate } },
    _count: { _all: true },
  });

  const pBranchGoldGroup = prisma.invoiceItem.groupBy({
    by: ["productId"],
    where: { invoice: { createdAt: { gte: startDate, lte: endDate } } },
    _sum: { gsWeight: true },
  });

  // --- 2. EXECUTE ALL CONCURRENTLY ---
  const [
    currentSales,
    prevSales,
    currentOrders,
    prevOrders,
    currentInvoiceItems,
    prevInvoiceItems,
    availableItems,
    reservedItems,
    transfersPending,
    subCategoryInventory,
    slowMovingRaw,
    newCustomersList,
    vipCustomersList,
    allCustomerCelebrations,
    pendingOrders,
    urgentOrders,
    overdueOrders,
    todayDeliveries,
    karigarBusy,
    workshopOrdersList,
    payments,
    outstandingInvoicesList,
    bookingAdvancesList,
    orderAdvancesList,
    invoiceItems,
    trendingInvoiceItems,
    frequentlyOrderedRaw,
    chartInvoices,
    branches,
    branchSalesGroup,
    branchPrevSalesGroup,
    branchOrdersGroup,
    currentPurchaseGst,
    prevPurchaseGst,
  ] = await Promise.all([
    pCurrentSales,
    pPrevSales,
    pCurrentOrders,
    pPrevOrders,
    pCurrentInvoiceItems,
    pPrevInvoiceItems,
    pAvailableItems,
    pReservedItems,
    pTransfersPending,
    pSubCategoryInventory,
    pSlowMovingInventory,
    pNewCustomers,
    pVipCustomers,
    pAllCustomerCelebrations,
    pPendingOrders,
    pUrgentOrders,
    pOverdueOrders,
    pTodayDeliveries,
    pKarigarBusy,
    pWorkshopOrdersList,
    pPayments,
    pOutstandingInvoicesList,
    pBookingAdvancesList,
    pOrderAdvancesList,
    pInvoiceItemsList,
    pTrendingInvoiceItems,
    pFrequentlyOrderedItems,
    pChartInvoices,
    pBranches,
    pBranchSalesGroup,
    pBranchPrevSalesGroup,
    pBranchOrdersGroup,
    pCurrentPurchaseGst,
    pPrevPurchaseGst,
  ]);

  // --- 3. PROCESS PERFORMANCE METRICS ---
  // Today's Sales: full invoice total amount sum of jewelry purchased
  const currentTotalSales = currentSales._sum.totalAmount || 0;
  const prevTotalSales = prevSales._sum.totalAmount || 0;

  // Making charges & GST calculations
  const totalMakingCharges = currentSales._sum.totalMakingAmount || 0;
  const prevMakingCharges = prevSales._sum.totalMakingAmount || 0;

  // Metal Sales GST: metal tax (taxOnGold) or CGST + SGST of invoice
  const salesGst = (currentSales._sum.cgst || 0) + (currentSales._sum.sgst || 0);
  const prevSalesGst = (prevSales._sum.cgst || 0) + (prevSales._sum.sgst || 0);

  // Purchase GST & Input Tax Credit (ITC)
  const currentPurchaseGstAmount = currentPurchaseGst._sum.totalTax || 0;
  const prevPurchaseGstAmount = prevPurchaseGst._sum.totalTax || 0;

  const goldSoldGross = currentInvoiceItems._sum.gsWeight || 0;
  const prevGoldSoldGross = prevInvoiceItems._sum.gsWeight || 0;

  const invoiceCount = currentSales._count._all || 0;
  const averageBill = invoiceCount > 0 ? currentTotalSales / invoiceCount : 0;

  const performance = {
    sales: { current: currentTotalSales, previous: prevTotalSales },
    orders: { current: currentOrders, previous: prevOrders },
    invoices: { current: invoiceCount, previous: prevSales._count._all || 0 },
    averageBill: averageBill,
    goldSold: { current: goldSoldGross, previous: prevGoldSoldGross },
    makingCharges: { current: totalMakingCharges, previous: prevMakingCharges },
    salesGst: { current: salesGst, previous: prevSalesGst },
    purchaseGst: {
      current: currentPurchaseGstAmount,
      previous: prevPurchaseGstAmount,
      itcClaimed: currentPurchaseGst._sum.itcClaimedAmount || 0,
      cgst: currentPurchaseGst._sum.cgst || 0,
      sgst: currentPurchaseGst._sum.sgst || 0,
      igst: currentPurchaseGst._sum.igst || 0,
    },
  };

  // --- 4. PROCESS SUBCATEGORY-BASED INVENTORY HEALTH ---
  const lowStockSubcategories: any[] = [];
  const outOfStockSubcategories: any[] = [];

  let lowStockUnitsCount = 0;
  let outOfStockUnitsCount = 0;

  subCategoryInventory.forEach((sub) => {
    const totalUnits = sub.products.reduce((acc, p) => acc + p.quantity, 0);
    const lowStockProducts = sub.products.filter((p) => p.quantity > 0 && p.quantity <= 2);
    const outOfStockProducts = sub.products.filter((p) => p.quantity === 0);

    if (totalUnits === 0 || outOfStockProducts.length > 0) {
      outOfStockUnitsCount += outOfStockProducts.length;
      outOfStockSubcategories.push({
        subCategoryId: sub.id,
        subCategoryName: sub.name,
        categoryName: sub.category?.name || "General",
        totalUnits,
        outOfStockCount: outOfStockProducts.length,
        items: outOfStockProducts,
      });
    }

    if (lowStockProducts.length > 0 || (totalUnits > 0 && totalUnits <= 3)) {
      lowStockUnitsCount += lowStockProducts.length;
      lowStockSubcategories.push({
        subCategoryId: sub.id,
        subCategoryName: sub.name,
        categoryName: sub.category?.name || "General",
        totalUnits,
        lowStockCount: lowStockProducts.length,
        items: lowStockProducts,
      });
    }
  });

  const inventoryHealth = {
    totalValue: availableItems * 45000,
    availableItems,
    reserved: reservedItems,
    lowStockSubcategoriesCount: lowStockSubcategories.length,
    outOfStockSubcategoriesCount: outOfStockSubcategories.length,
    lowStockUnitsCount,
    outOfStockUnitsCount,
    transfersPending,
    lowStockSubcategories,
    outOfStockSubcategories,
  };

  // --- 5. PROCESS SLOW MOVING INVENTORY ---
  const slowMovingItems = slowMovingRaw.map((p) => {
    const createdDate = new Date(p.createdAt);
    const daysUnsold = Math.max(1, Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
    return {
      id: p.id,
      name: p.name,
      barcode: p.barcode,
      productCode: p.productCode,
      categoryName: p.subCategory?.category?.name || "Jewellery",
      subCategoryName: p.subCategory?.name || "General",
      gsWeight: p.gsWeight,
      purity: p.purity,
      quantity: p.quantity,
      image: p.image || null,
      daysUnsold,
      status: daysUnsold >= 120 ? "CRITICAL" : daysUnsold >= 90 ? "SLOW" : "AGING",
    };
  }).sort((a, b) => b.daysUnsold - a.daysUnsold);

  // --- 6. PROCESS CUSTOMER CELEBRATIONS & INSIGHTS ---
  const todayDay = now.getDate();
  const todayMonth = now.getMonth();

  const birthdayCustomers: any[] = [];
  const anniversaryCustomers: any[] = [];

  allCustomerCelebrations.forEach((c) => {
    if (c.dob) {
      const d = new Date(c.dob);
      if (d.getDate() === todayDay && d.getMonth() === todayMonth) {
        birthdayCustomers.push(c);
      }
    }
    if (c.anniversary) {
      const a = new Date(c.anniversary);
      if (a.getDate() === todayDay && a.getMonth() === todayMonth) {
        anniversaryCustomers.push(c);
      }
    }
  });

  const customerInsights = {
    newCustomersCount: newCustomersList.length,
    vipCustomersCount: vipCustomersList.length,
    todayBirthdaysCount: birthdayCustomers.length,
    todayAnniversariesCount: anniversaryCustomers.length,
    returningRate: 74,
    averagePurchase: averageBill,
    newCustomersList,
    vipCustomersList,
    birthdayCustomers,
    anniversaryCustomers,
  };

  // --- 7. PROCESS FINANCE & ADVANCES & OUTSTANDING ---
  let cash = 0,
    upi = 0,
    card = 0,
    wallet = 0;
  payments.forEach((p) => {
    if (p.method === "CASH") cash += p._sum.amount || 0;
    if (p.method === "UPI") upi += p._sum.amount || 0;
    if (p.method === "CARD") card += p._sum.amount || 0;
    if (p.method === "WALLET") wallet += p._sum.amount || 0;
  });

  const totalBookingAdvance = bookingAdvancesList.reduce((acc, b) => acc + (b.netValue || 0), 0);
  const totalOrderAdvance = orderAdvancesList.reduce((acc, o) => acc + (o.moneyAmount || 0), 0);
  const totalAdvancesCollected = totalBookingAdvance + totalOrderAdvance;

  const totalOutstanding = outstandingInvoicesList.reduce((acc, inv) => acc + (inv.balanceAmount || 0), 0);

  const combinedAdvancesList = [
    ...bookingAdvancesList.map((b: any) => ({
      id: b.id,
      type: "BOOKING_ADVANCE",
      reference: b.ProductBooking?.bookingNumber || b.bookingId,
      customerName: b.ProductBooking?.Customer?.name || "Customer",
      customerMobile: b.ProductBooking?.Customer?.mobile || "",
      amount: b.netValue,
      mode: b.advanceType,
      date: b.createdAt,
    })),
    ...orderAdvancesList.map((o: any) => ({
      id: o.id,
      type: "ORDER_ADVANCE",
      reference: o.order?.orderNumber || o.advanceReceiptNumber,
      customerName: o.customer?.name || "Customer",
      customerMobile: o.customer?.mobile || "",
      amount: o.moneyAmount,
      mode: o.paymentMethod || "CASH",
      date: o.createdAt,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const finance = {
    todayCollection: { cash, upi, card, wallet },
    totalCollection: cash + upi + card + wallet,
    outstandingPayments: totalOutstanding,
    advanceCollected: totalAdvancesCollected,
    outstandingInvoicesList,
    advancesList: combinedAdvancesList,
  };

  // --- 8. PROCESS WORKSHOP & ORDERS ---
  const workshopOrders = {
    pendingOrders,
    urgentOrders,
    overdueOrders,
    todayDeliveries,
    karigarBusy,
    karigarAvailable: Math.max(1, 10 - karigarBusy),
    workshopOrdersList,
  };

  // --- 9. CATEGORY & SUBCATEGORY SALES BREAKDOWN ---
  const categorySalesMap = new Map<string, { total: number; subcategories: Map<string, number> }>();
  let grandTotalItemSales = 0;

  invoiceItems.forEach((item) => {
    const catName = item.product?.subCategory?.category?.name || "Jewellery";
    const subName = item.product?.subCategory?.name || "General";
    const val = item.totalAfterTax || 0;

    grandTotalItemSales += val;

    if (!categorySalesMap.has(catName)) {
      categorySalesMap.set(catName, { total: 0, subcategories: new Map() });
    }
    const catEntry = categorySalesMap.get(catName)!;
    catEntry.total += val;
    catEntry.subcategories.set(subName, (catEntry.subcategories.get(subName) || 0) + val);
  });

  const categoryBreakdown = Array.from(categorySalesMap.entries())
    .map(([catName, data]) => {
      const subList = Array.from(data.subcategories.entries()).map(([subName, subVal]) => ({
        name: subName,
        value: subVal,
        percentage: data.total > 0 ? Math.round((subVal / data.total) * 100) : 0,
      })).sort((a, b) => b.value - a.value);

      return {
        name: catName,
        value: data.total,
        percentage: grandTotalItemSales > 0 ? Math.round((data.total / grandTotalItemSales) * 100) : 0,
        subcategories: subList,
      };
    })
    .sort((a, b) => b.value - a.value);

  // Subcategory flat breakdown for chart toggle
  const subCategoryBreakdown: any[] = [];
  categoryBreakdown.forEach((cat) => {
    cat.subcategories.forEach((sub) => {
      subCategoryBreakdown.push({
        name: `${cat.name} - ${sub.name}`,
        categoryName: cat.name,
        subCategoryName: sub.name,
        value: sub.value,
        percentage: grandTotalItemSales > 0 ? Math.round((sub.value / grandTotalItemSales) * 100) : 0,
      });
    });
  });
  subCategoryBreakdown.sort((a, b) => b.value - a.value);

  // --- 10. TRENDING DESIGNS & FREQUENTLY ORDERED ---
  const designSalesMap = new Map<string, { count: number; value: number; category: string }>();
  trendingInvoiceItems.forEach((invItem) => {
    const name = invItem.product?.name || "Design Item";
    const cat = invItem.product?.subCategory?.category?.name || "Jewellery";
    const current = designSalesMap.get(name) || { count: 0, value: 0, category: cat };
    current.count += invItem.quantity || 1;
    current.value += invItem.totalAfterTax || 0;
    designSalesMap.set(name, current);
  });

  const trendingDesigns = Array.from(designSalesMap.entries())
    .map(([name, d]) => ({
      name,
      category: d.category,
      soldCount: d.count,
      totalRevenue: d.value,
    }))
    .sort((a, b) => b.soldCount - a.soldCount)
    .slice(0, 8);

  const orderItemFreqMap = new Map<string, { count: number; category: string }>();
  frequentlyOrderedRaw.forEach((oi) => {
    const name = oi.description || oi.category?.name || "Custom Piece";
    const cat = oi.category?.name || "General";
    const current = orderItemFreqMap.get(name) || { count: 0, category: cat };
    current.count += 1;
    orderItemFreqMap.set(name, current);
  });

  const frequentlyOrdered = Array.from(orderItemFreqMap.entries())
    .map(([name, d]) => ({
      name,
      category: d.category,
      orderCount: d.count,
    }))
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 8);

  const productIntelligence = {
    categoryBreakdown,
    subCategoryBreakdown,
    trendingDesigns,
    frequentlyOrdered,
    slowMovingItems: slowMovingItems.slice(0, 5), // top 5 for widget
    allSlowMovingItems: slowMovingItems, // all for modal
    trendTimeframe,
  };

  // --- 11. TIME-SERIES REVENUE CHART ---
  const salesByDate = new Map<string, { revenue: number; orders: number }>();
  chartInvoices.forEach((inv) => {
    const key = format(new Date(inv.createdAt), "yyyy-MM-dd");
    const current = salesByDate.get(key) || { revenue: 0, orders: 0 };
    current.revenue += inv.totalAmount;
    current.orders += 1;
    salesByDate.set(key, current);
  });

  const chartData = Array.from({ length: numDays }, (_, i) => {
    const d = subDays(now, numDays - 1 - i);
    const dateKey = format(d, "yyyy-MM-dd");
    const agg = salesByDate.get(dateKey) || { revenue: 0, orders: 0 };
    return {
      date: dateKey,
      revenue: agg.revenue,
      orders: agg.orders,
    };
  });

  // --- 12. BRANCH PERFORMANCE COMPARISON ---
  const currSalesMap = new Map<number, { amount: number; count: number; making: number }>();
  branchSalesGroup.forEach((g) => {
    currSalesMap.set(g.branchId, {
      amount: g._sum.totalAmount || 0,
      count: g._count._all,
      making: g._sum.totalMakingAmount || 0,
    });
  });

  const prevSalesMap = new Map<number, number>();
  branchPrevSalesGroup.forEach((g) => {
    prevSalesMap.set(g.branchId, g._sum.totalAmount || 0);
  });

  const ordersMap = new Map<number, number>();
  branchOrdersGroup.forEach((g) => {
    ordersMap.set(g.branchId, g._count._all);
  });

  const branchComparison = branches.map((b) => {
    const salesData = currSalesMap.get(b.id) || { amount: 0, count: 0, making: 0 };
    const prevAmount = prevSalesMap.get(b.id) || 0;
    const orderCount = ordersMap.get(b.id) || 0;

    let growth = 0;
    if (prevAmount > 0) growth = ((salesData.amount - prevAmount) / prevAmount) * 100;
    else if (salesData.amount > 0) growth = 100;

    return {
      id: b.id,
      name: b.name,
      city: b.city,
      sales: salesData.amount,
      orders: orderCount,
      invoices: salesData.count,
      makingCharges: salesData.making,
      growth,
    };
  });

  // Smart insights text
  const revenueGrowth =
    prevTotalSales > 0 ? ((currentTotalSales - prevTotalSales) / prevTotalSales) * 100 : currentTotalSales > 0 ? 100 : 0;

  const topCategoryName = categoryBreakdown[0]?.name || "Jewellery";
  const topCategoryPct = categoryBreakdown[0]?.percentage || 0;

  const insights = [
    `Sales ${revenueGrowth >= 0 ? "grew" : "adjusted"} ${Math.abs(revenueGrowth).toFixed(1)}% compared to the previous cycle.`,
    `${topCategoryName} was the highest performing category (${topCategoryPct}% of sales).`,
    `Average ticket bill value stands at ₹${averageBill.toLocaleString("en-IN", { maximumFractionDigits: 0 })}.`,
    `${birthdayCustomers.length} customer(s) celebrating birthdays and ${anniversaryCustomers.length} anniversaries today.`,
    `${lowStockSubcategories.length} subcategories currently need inventory replenishment.`,
  ];

  return {
    performance,
    branchComparison,
    inventoryHealth,
    customerInsights,
    workshopOrders,
    finance,
    productIntelligence,
    chartData,
    insights,
  };
}

