import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

const getKaratage = (purity: number) => {
  if (!purity) return 22;
  const val = purity > 1 ? purity / 100 : purity;
  if (Math.abs(val - 0.916) < 0.01) return 22;
  if (Math.abs(val - 0.75) < 0.01) return 18;
  if (Math.abs(val - 0.585) < 0.01) return 14;
  return Math.round(val * 24);
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const branchId = parseInt(searchParams.get("branchId") || "0");
    const format = searchParams.get("format") || "excel"; // "excel" | "pdf"
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const status = searchParams.get("status");
    const paymentMethod = searchParams.get("paymentMethod");
    const salespersonId = searchParams.get("salespersonId");
    const huidStatus = searchParams.get("huidStatus");
    const amountMin = searchParams.get("amountMin") ? parseFloat(searchParams.get("amountMin")!) : undefined;
    const amountMax = searchParams.get("amountMax") ? parseFloat(searchParams.get("amountMax")!) : undefined;

    if (!branchId) {
      return NextResponse.json({ error: "branchId is required" }, { status: 400 });
    }

    // Build where clause
    const where: any = { branchId };

    // Date filtering
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Search filtering (invoice number or customer name)
    if (search.trim()) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { mobile: { contains: search } } },
      ];
    }

    // Status filtering
    if (status) {
      if (status === "PAID") {
        where.isFullyPaid = true;
      } else if (status === "PENDING") {
        where.isFullyPaid = false;
        where.paidAmount = 0;
      } else if (status === "PARTIAL") {
        where.isFullyPaid = false;
        where.paidAmount = { gt: 0 };
      }
    }

    // Payment method filtering
    if (paymentMethod && paymentMethod !== "ALL") {
      where.paymentMethod = paymentMethod;
    }

    // Salesperson filtering
    if (salespersonId && salespersonId !== "ALL") {
      where.createdById = parseInt(salespersonId);
    }

    // HUID filtering
    if (huidStatus) {
      if (huidStatus === "WITH_HUID") {
        where.items = {
          some: {
            product: {
              huidNumber: { not: null },
            },
          },
        };
      } else if (huidStatus === "MISSING_HUID") {
        where.items = {
          some: {
            product: {
              OR: [
                { huidNumber: null },
                { huidNumber: "" }
              ]
            },
          },
        };
      }
    }

    // Amount range filtering
    if (amountMin !== undefined || amountMax !== undefined) {
      where.totalAmount = {};
      if (amountMin !== undefined) where.totalAmount.gte = amountMin;
      if (amountMax !== undefined) where.totalAmount.lte = amountMax;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: true,
        createdBy: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const periodStr = `${dateFrom ? new Date(dateFrom).toLocaleDateString("en-IN") : "start"}_to_${dateTo ? new Date(dateTo).toLocaleDateString("en-IN") : "end"}`.replace(/ /g, "");

    // ──────────────── EXCEL EXPORT ────────────────
    if (format === "excel") {
      const summaryRows = invoices.map(inv => {
        const invStatus = inv.isFullyPaid ? "PAID" : inv.paidAmount > 0 ? "PARTIAL" : "PENDING";
        const netWt = inv.items.reduce((s, i) => s + i.ntWeight, 0);
        return {
          "Invoice No.": inv.invoiceNumber,
          Date: new Date(inv.createdAt).toLocaleDateString("en-IN"),
          "Customer Name": inv.customer.name,
          "Customer Mobile": inv.customer.mobile,
          "Customer GSTIN": inv.customer.gstin || "",
          "Net Weight (g)": parseFloat(netWt.toFixed(3)),
          "Taxable Amount": inv.totalMetalAmount + inv.totalMakingAmount + inv.totalStoneAmount,
          CGST: inv.cgst,
          SGST: inv.sgst,
          "Total Amount": inv.totalAmount,
          "Paid Amount": inv.paidAmount,
          "Balance Due": inv.balanceAmount,
          Status: invStatus,
          "Payment Method": inv.paymentMethod,
          Salesperson: inv.createdBy?.name || "System"
        };
      });

      const itemRows: any[] = [];
      for (const inv of invoices) {
        for (const item of inv.items) {
          itemRows.push({
            "Invoice No.": inv.invoiceNumber,
            "Product Name": item.product.name,
            "Product Code": item.product.productCode,
            Quantity: item.quantity,
            "Net Weight (g)": item.ntWeight,
            "Purity": item.product.purity,
            "Karatage": getKaratage(item.product.purity),
            "Metal Value": item.metalValue,
            "Making Amount": item.makingAmount,
            "Total": item.totalAfterTax
          });
        }
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Invoice Summary");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(itemRows), "Item Details");

      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="Invoice_Export_${periodStr}.xlsx"`,
        },
      });
    }

    // ──────────────── PDF EXPORT ────────────────
    if (format === "pdf") {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      // Cover / Header
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Invoices Export Summary", 15, 20);
      doc.setFontSize(10);
      doc.setFont("Helvetica", "normal");
      doc.text(`Period: ${periodStr.replace(/_/g, " ")} | Count: ${invoices.length} invoices`, 15, 26);

      let y = 35;
      doc.setFillColor(240, 240, 240);
      doc.rect(10, y, 277, 8, "F");
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.text("Invoice No", 12, y + 6);
      doc.text("Date", 38, y + 6);
      doc.text("Customer", 62, y + 6);
      doc.text("Net Wt", 112, y + 6, { align: "right" });
      doc.text("Taxable", 137, y + 6, { align: "right" });
      doc.text("GST", 162, y + 6, { align: "right" });
      doc.text("Total", 187, y + 6, { align: "right" });
      doc.text("Paid", 212, y + 6, { align: "right" });
      doc.text("Balance", 237, y + 6, { align: "right" });
      doc.text("Method / Status", 242, y + 6);

      doc.setFont("Helvetica", "normal");
      y += 8;

      let totalWt = 0;
      let totalTaxable = 0;
      let totalGst = 0;
      let totalAmt = 0;
      let totalPaid = 0;
      let totalDue = 0;

      for (const inv of invoices) {
        if (y > 185) {
          doc.text(`Page ${doc.getNumberOfPages()}`, 275, 200, { align: "right" });
          doc.addPage();
          y = 25;
          doc.setFillColor(240, 240, 240);
          doc.rect(10, y, 277, 8, "F");
          doc.setFont("Helvetica", "bold");
          doc.text("Invoice No", 12, y + 6);
          doc.text("Date", 38, y + 6);
          doc.text("Customer", 62, y + 6);
          doc.text("Net Wt", 112, y + 6, { align: "right" });
          doc.text("Taxable", 137, y + 6, { align: "right" });
          doc.text("GST", 162, y + 6, { align: "right" });
          doc.text("Total", 187, y + 6, { align: "right" });
          doc.text("Paid", 212, y + 6, { align: "right" });
          doc.text("Balance", 237, y + 6, { align: "right" });
          doc.text("Method / Status", 242, y + 6);
          doc.setFont("Helvetica", "normal");
          y += 8;
        }

        const netWt = inv.items.reduce((s, i) => s + i.ntWeight, 0);
        const taxable = inv.totalMetalAmount + inv.totalMakingAmount + inv.totalStoneAmount;
        const gst = inv.cgst + inv.sgst;
        const status = inv.isFullyPaid ? "PAID" : inv.paidAmount > 0 ? "PARTIAL" : "PENDING";

        totalWt += netWt;
        totalTaxable += taxable;
        totalGst += gst;
        totalAmt += inv.totalAmount;
        totalPaid += inv.paidAmount;
        totalDue += inv.balanceAmount;

        doc.line(10, y, 287, y);
        doc.text(inv.invoiceNumber, 12, y + 5);
        doc.text(new Date(inv.createdAt).toLocaleDateString("en-IN"), 38, y + 5);
        doc.text(inv.customer.name.slice(0, 25), 62, y + 5);
        doc.text(netWt.toFixed(3), 112, y + 5, { align: "right" });
        doc.text(taxable.toFixed(0), 137, y + 5, { align: "right" });
        doc.text(gst.toFixed(0), 162, y + 5, { align: "right" });
        doc.text(inv.totalAmount.toFixed(0), 187, y + 5, { align: "right" });
        doc.text(inv.paidAmount.toFixed(0), 212, y + 5, { align: "right" });
        doc.text(inv.balanceAmount.toFixed(0), 237, y + 5, { align: "right" });
        doc.text(`${inv.paymentMethod} / ${status}`, 242, y + 5);
        y += 7;
      }

      // Total row
      doc.line(10, y, 287, y);
      doc.setFillColor(245, 245, 245);
      doc.rect(10, y, 277, 8, "F");
      doc.setFont("Helvetica", "bold");
      doc.text("TOTALS", 12, y + 6);
      doc.text(totalWt.toFixed(3), 112, y + 6, { align: "right" });
      doc.text(totalTaxable.toFixed(0), 137, y + 6, { align: "right" });
      doc.text(totalGst.toFixed(0), 162, y + 6, { align: "right" });
      doc.text(totalAmt.toFixed(0), 187, y + 6, { align: "right" });
      doc.text(totalPaid.toFixed(0), 212, y + 6, { align: "right" });
      doc.text(totalDue.toFixed(0), 237, y + 6, { align: "right" });
      doc.setFont("Helvetica", "normal");
      
      doc.text(`Page ${doc.getNumberOfPages()}`, 275, 200, { align: "right" });

      const pdfBuffer = doc.output("arraybuffer");
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="Invoice_Summary_${periodStr}.pdf"`
        }
      });
    }

    return NextResponse.json({ error: "Invalid format requested" }, { status: 400 });

  } catch (error: any) {
    console.error("Invoices export failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export invoices list" },
      { status: 500 }
    );
  }
}
