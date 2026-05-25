import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = parseInt(searchParams.get("branchId") || "0");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const format = searchParams.get("format") || "json"; // "json" | "excel"

    if (!branchId) {
      return NextResponse.json({ error: "branchId is required" }, { status: 400 });
    }

    // Build where clause
    const where: any = { branchId };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: {
          select: { name: true, mobile: true, gstin: true },
        },
        branch: {
          select: { name: true },
        },
        items: {
          select: {
            quantity: true,
            ntWeight: true,
            metalValue: true,
            makingAmount: true,
            totalAfterTax: true,
            product: {
              select: { name: true, productCode: true },
            },
          },
        },
        payments: {
          select: { method: true, amount: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // For preview (JSON) — return summary
    if (format === "json") {
      const totalValue = invoices.reduce((s, inv) => s + inv.totalAmount, 0);
      const totalGst = invoices.reduce((s, inv) => s + inv.cgst + inv.sgst, 0);
      return NextResponse.json({
        count: invoices.length,
        totalValue,
        totalGst,
        invoices: invoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          date: inv.createdAt,
          customerName: inv.customer.name,
          totalAmount: inv.totalAmount,
          gst: inv.cgst + inv.sgst,
          status: inv.isFullyPaid ? "PAID" : "PENDING",
        })),
      });
    }

    // Excel export
    if (format === "excel") {
      // Build summary sheet data
      const summaryRows = invoices.map((inv) => ({
        "Invoice No.": inv.invoiceNumber,
        Date: new Date(inv.createdAt).toLocaleDateString("en-IN"),
        "Customer Name": inv.customer.name,
        "Customer Mobile": inv.customer.mobile,
        "Customer GSTIN": inv.customer.gstin || "",
        Branch: inv.branch.name,
        "Metal Amount": inv.totalMetalAmount,
        "Making Amount": inv.totalMakingAmount,
        "Stone Amount": inv.totalStoneAmount,
        "Hallmarking": inv.hallmarkingCharge,
        CGST: inv.cgst,
        SGST: inv.sgst,
        "Total Amount": inv.totalAmount,
        "Paid Amount": inv.paidAmount,
        "Balance": inv.balanceAmount,
        Status: inv.isFullyPaid ? "PAID" : "PENDING",
        "Payment Method": inv.paymentMethod,
      }));

      // Build items sheet data
      const itemRows: any[] = [];
      for (const inv of invoices) {
        for (const item of inv.items) {
          itemRows.push({
            "Invoice No.": inv.invoiceNumber,
            "Product Name": item.product.name,
            "Product Code": item.product.productCode,
            Quantity: item.quantity,
            "Net Weight (g)": item.ntWeight,
            "Metal Value": item.metalValue,
            "Making Amount": item.makingAmount,
            "Total": item.totalAfterTax,
          });
        }
      }

      // Build GST sheet
      const gstRows = invoices
        .filter((inv) => inv.cgst > 0 || inv.sgst > 0)
        .map((inv) => ({
          "Invoice No.": inv.invoiceNumber,
          Date: new Date(inv.createdAt).toLocaleDateString("en-IN"),
          "Customer": inv.customer.name,
          "Customer GSTIN": inv.customer.gstin || "N/A",
          "Taxable Amount": inv.totalMetalAmount + inv.totalMakingAmount,
          CGST: inv.cgst,
          SGST: inv.sgst,
          "Total Tax": inv.cgst + inv.sgst,
          "Total With Tax": inv.totalAmount,
        }));

      // Create workbook
      const wb = XLSX.utils.book_new();

      const ws1 = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, ws1, "Invoice Summary");

      const ws2 = XLSX.utils.json_to_sheet(itemRows);
      XLSX.utils.book_append_sheet(wb, ws2, "Item Details");

      const ws3 = XLSX.utils.json_to_sheet(gstRows);
      XLSX.utils.book_append_sheet(wb, ws3, "GST Report");

      // Generate buffer
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      const fromDate = dateFrom
        ? new Date(dateFrom).toLocaleDateString("en-IN").replace(/\//g, "-")
        : "start";
      const toDate = dateTo
        ? new Date(dateTo).toLocaleDateString("en-IN").replace(/\//g, "-")
        : "end";

      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="Sales_Report_${fromDate}_to_${toDate}.xlsx"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  } catch (error: any) {
    console.error("Export failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export" },
      { status: 500 }
    );
  }
}
