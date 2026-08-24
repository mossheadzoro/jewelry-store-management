import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = parseInt(searchParams.get("branchId") || "0");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (!branchId) {
      return NextResponse.json({ error: "branchId is required" }, { status: 400 });
    }

    // Build date filter
    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const where: any = {
      branchId,
      ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
    };

    const [invoices, currentAgg, pendingInvoiceCount] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: true,
          createdBy: true,
          items: {
            include: {
              product: {
                include: {
                  subCategory: {
                    include: {
                      category: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.invoice.aggregate({
        where,
        _sum: {
          totalAmount: true,
          cgst: true,
          sgst: true,
          balanceAmount: true,
          paidAmount: true,
        }
      }),
      prisma.invoice.count({
        where: {
          ...where,
          isFullyPaid: false,
        }
      })
    ]);

    const totalSales = currentAgg._sum.totalAmount || 0;
    const cgstCollected = currentAgg._sum.cgst || 0;
    const sgstCollected = currentAgg._sum.sgst || 0;
    const gstCollected = cgstCollected + sgstCollected;
    const netRevenue = totalSales - gstCollected;
    const pendingDues = currentAgg._sum.balanceAmount || 0;

    // ── SHEET 1: SUMMARY ──
    const summaryRows = [
      { Metric: "Total Gross Sales (INR)", Value: totalSales },
      { Metric: "Net Revenue (after GST) (INR)", Value: netRevenue },
      { Metric: "Total GST Collected (INR)", Value: gstCollected },
      { Metric: "CGST Collected (INR)", Value: cgstCollected },
      { Metric: "SGST Collected (INR)", Value: sgstCollected },
      { Metric: "Pending Dues (INR)", Value: pendingDues },
      { Metric: "Unpaid/Partial Invoices Count", Value: pendingInvoiceCount },
      { Metric: "Total Invoices Raised", Value: invoices.length }
    ];

    // ── SHEET 2: ALL INVOICES ──
    const invoiceRows = invoices.map((inv: any) => {
      const status = inv.isFullyPaid ? "PAID" : inv.paidAmount > 0 ? "PARTIAL" : "PENDING";
      return {
        "Invoice No.": inv.invoiceNumber,
        Date: new Date(inv.createdAt).toLocaleDateString("en-IN"),
        "Customer Name": inv.customer.name,
        "Customer Phone": inv.customer.mobile,
        "Customer GSTIN": inv.customer.gstin || "N/A",
        "Total Weight (g)": inv.items.reduce((s: number, i: any) => s + i.ntWeight, 0),
        "Metal Value (INR)": inv.totalMetalAmount,
        "Making Charges (INR)": inv.totalMakingAmount,
        "Stone Charges (INR)": inv.totalStoneAmount,
        "Hallmarking Charges (INR)": inv.hallmarkingCharge,
        CGST: inv.cgst,
        SGST: inv.sgst,
        "Grand Total (INR)": inv.totalAmount,
        "Paid Amount (INR)": inv.paidAmount,
        "Balance Due (INR)": inv.balanceAmount,
        "Payment Method": inv.paymentMethod,
        Status: status,
        Salesperson: inv.createdBy?.name || "System"
      };
    });

    // ── SHEET 3: GST DETAIL ──
    const gstDetailRows = invoices.map((inv: any) => ({
      "Invoice No.": inv.invoiceNumber,
      Date: new Date(inv.createdAt).toLocaleDateString("en-IN"),
      "Customer Name": inv.customer.name,
      "Customer GSTIN": inv.customer.gstin || "N/A",
      "Taxable Value (INR)": inv.totalMetalAmount + inv.totalMakingAmount + inv.totalStoneAmount,
      "CGST (1.5%)": inv.cgst,
      "SGST (1.5%)": inv.sgst,
      "Total GST (3.0%)": inv.cgst + inv.sgst,
      "Grand Total (INR)": inv.totalAmount
    }));

    // ── SHEET 4: SALES BY CATEGORY ──
    const categorySummaryMap = new Map<string, { itemsSold: number; netWt: number; revenue: number }>();
    for (const inv of invoices) {
      for (const item of inv.items) {
        const catName = item.product.subCategory.category.name || "General";
        const existing = categorySummaryMap.get(catName) || { itemsSold: 0, netWt: 0, revenue: 0 };
        existing.itemsSold += item.quantity;
        existing.netWt += item.ntWeight || 0;
        existing.revenue += item.totalAfterTax || 0;
        categorySummaryMap.set(catName, existing);
      }
    }

    const categoryRows = Array.from(categorySummaryMap.entries()).map(([category, details]: [string, any]) => ({
      Category: category,
      "Items Sold": details.itemsSold,
      "Total Net Weight (g)": parseFloat(details.netWt.toFixed(3)),
      "Total Revenue (INR)": parseFloat(details.revenue.toFixed(2)),
      "Percentage (%)": totalSales > 0 ? parseFloat(((details.revenue / totalSales) * 100).toFixed(1)) : 0
    })).sort((a: any, b: any) => b["Total Revenue (INR)"] - a["Total Revenue (INR)"]);

    // ── SHEET 5: PAYMENT BREAKDOWN ──
    const paymentSummaryMap = new Map<string, { count: number; amount: number }>();
    for (const inv of invoices) {
      const existing = paymentSummaryMap.get(inv.paymentMethod) || { count: 0, amount: 0 };
      existing.count += 1;
      existing.amount += inv.totalAmount;
      paymentSummaryMap.set(inv.paymentMethod, existing);
    }

    const totalPayments = Array.from(paymentSummaryMap.values()).reduce((sum: number, item: any) => sum + item.amount, 0);
    const paymentRows = Array.from(paymentSummaryMap.entries()).map(([method, details]: [string, any]) => ({
      "Payment Method": method,
      "Transactions Count": details.count,
      "Total Collected (INR)": parseFloat(details.amount.toFixed(2)),
      "Percentage (%)": totalPayments > 0 ? parseFloat(((details.amount / totalPayments) * 100).toFixed(1)) : 0
    })).sort((a: any, b: any) => b["Total Collected (INR)"] - a["Total Collected (INR)"]);

    // Create Excel book
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Summary");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invoiceRows), "All Invoices");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(gstDetailRows), "GST Detail");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(categoryRows), "Sales by Category");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paymentRows), "Payment Breakdown");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const periodStr = `${dateFrom ? dateFrom.replace(/-/g, "") : "start"}_to_${dateTo ? dateTo.replace(/-/g, "") : "end"}`;
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Reports_Sheet_${periodStr}.xlsx"`,
      },
    });

  } catch (error: any) {
    console.error("Excel generation failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate Excel reports sheet" },
      { status: 500 }
    );
  }
}
