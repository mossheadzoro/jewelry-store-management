// client/src/app/api/purchase/audit/export/route.ts
// Purchase Audit Trail Export Engine (Excel, CSV, PDF)

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = auth.user.systemRole;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId")
      ? parseInt(searchParams.get("branchId")!, 10)
      : auth.branchId;
    const format = (searchParams.get("format") || "xlsx").toLowerCase(); // "xlsx" | "csv" | "pdf"
    const search = searchParams.get("search")?.trim() || undefined;
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const purchaseModules = [
      "PURCHASE_BOOKING",
      "PURCHASE_INVOICE",
      "PURCHASE_PAYMENT",
      "PURCHASE_RECEIVING",
      "PURCHASE_TRANSFERS",
      "PURCHASE_RETURNS",
      "PURCHASE_GST",
      "PURCHASE_VERIFICATION",
      "PURCHASE_DOCUMENTS",
      "BULLION_SUPPLIERS",
    ];

    const where: any = {
      module: { in: purchaseModules },
      ...(branchId ? { branchId } : {}),
    };

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    if (search) {
      const orConditions: any[] = [
        { entityDisplayName: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search, mode: "insensitive" } },
        { action: { contains: search, mode: "insensitive" } },
        { userNameSnapshot: { contains: search, mode: "insensitive" } },
        { reason: { contains: search, mode: "insensitive" } },
      ];

      try {
        const matchedBookings = await prisma.purchaseBooking.findMany({
          where: {
            OR: [
              { bookingNumber: { contains: search, mode: "insensitive" } },
              { id: { equals: search } },
            ],
          },
          select: { id: true, bookingNumber: true },
          take: 10,
        });

        for (const bk of matchedBookings) {
          orConditions.push(
            { entityId: bk.id },
            { entityDisplayName: { contains: bk.bookingNumber, mode: "insensitive" } },
            { description: { contains: bk.bookingNumber, mode: "insensitive" } }
          );

          const [linkedPayments, linkedReceipts] = await Promise.all([
            prisma.purchasePayment.findMany({
              where: { purchaseBookingId: bk.id },
              select: { id: true, paymentNumber: true },
            }),
            prisma.purchaseMetalReceipt.findMany({
              where: { purchaseBookingId: bk.id },
              select: { id: true, receiptNumber: true },
            }),
          ]);

          linkedPayments.forEach((p) => {
            orConditions.push(
              { entityId: p.id },
              { entityDisplayName: { contains: p.paymentNumber, mode: "insensitive" } },
              { description: { contains: p.paymentNumber, mode: "insensitive" } }
            );
          });

          linkedReceipts.forEach((r) => {
            orConditions.push(
              { entityId: r.id },
              { entityDisplayName: { contains: r.receiptNumber, mode: "insensitive" } },
              { description: { contains: r.receiptNumber, mode: "insensitive" } }
            );
          });
        }
      } catch (err) {
        console.warn("Export audit search booking resolution warning:", err);
      }

      where.OR = orConditions;
    }

    const logs = await prisma.enterpriseAuditLog.findMany({
      where,
      orderBy: { createdAt: sortOrder },
      take: 2000,
    });

    const timestampStr = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const dateRangeLabel = from && to ? `${from.slice(0, 10)}_to_${to.slice(0, 10)}` : "All";
    const filenameBase = `Purchase_Audit_Report_${search ? search.replace(/[^a-zA-Z0-9_-]/g, "") + "_" : ""}${dateRangeLabel}_${timestampStr}`;

    // Flatten data for export
    const exportRows = logs.map((log, idx) => ({
      "Sl No": idx + 1,
      "Date & Time": new Date(log.createdAt).toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      "Action": log.action,
      "Severity": log.severity || "INFO",
      "Module": log.module,
      "User / Actor": log.userNameSnapshot || "System",
      "Role": log.roleSnapshot || "ADMIN",
      "Entity / Reference": log.entityDisplayName || log.entityId || "N/A",
      "Description": log.description || "",
      "IP Address": log.ipAddress || "127.0.0.1",
    }));

    // 1. CSV EXPORT
    if (format === "csv") {
      const headers = ["Sl No", "Date & Time", "Action", "Severity", "Module", "User / Actor", "Role", "Entity / Reference", "Description", "IP Address"];
      const csvLines = [
        headers.join(","),
        ...exportRows.map((r) =>
          [
            r["Sl No"],
            `"${r["Date & Time"]}"`,
            `"${r.Action}"`,
            `"${r.Severity}"`,
            `"${r.Module}"`,
            `"${r["User / Actor"]}"`,
            `"${r.Role}"`,
            `"${(r["Entity / Reference"] || "").replace(/"/g, '""')}"`,
            `"${(r.Description || "").replace(/"/g, '""')}"`,
            `"${r["IP Address"]}"`,
          ].join(",")
        ),
      ];
      const csvOutput = "\uFEFF" + csvLines.join("\r\n"); // UTF-8 BOM for Excel compatibility

      return new NextResponse(csvOutput, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filenameBase}.csv"`,
        },
      });
    }

    // 2. PDF EXPORT
    if (format === "pdf") {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Purchase Audit Trail Report", 14, 15);

      doc.setFontSize(9);
      doc.setFont("Helvetica", "normal");
      doc.text(`Generated On: ${new Date().toLocaleString("en-IN")}`, 14, 21);
      doc.text(`Filter: ${from && to ? `${new Date(from).toLocaleDateString("en-IN")} to ${new Date(to).toLocaleDateString("en-IN")}` : "All Time"} | Search: ${search || "All Bookings & Actions"} | Total Events: ${logs.length}`, 14, 26);

      let y = 32;
      doc.setFillColor(240, 240, 240);
      doc.rect(10, y, 277, 7, "F");
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.text("#", 12, y + 5);
      doc.text("Date & Time", 20, y + 5);
      doc.text("Action", 60, y + 5);
      doc.text("User", 110, y + 5);
      doc.text("Entity / Booking", 140, y + 5);
      doc.text("Description", 195, y + 5);

      doc.setFont("Helvetica", "normal");
      y += 8;

      for (let i = 0; i < exportRows.length; i++) {
        if (y > 190) {
          doc.setFontSize(7);
          doc.text(`Page ${doc.getNumberOfPages()}`, 275, 202, { align: "right" });
          doc.addPage();
          y = 15;
          doc.setFillColor(240, 240, 240);
          doc.rect(10, y, 277, 7, "F");
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(8);
          doc.text("#", 12, y + 5);
          doc.text("Date & Time", 20, y + 5);
          doc.text("Action", 60, y + 5);
          doc.text("User", 110, y + 5);
          doc.text("Entity / Booking", 140, y + 5);
          doc.text("Description", 195, y + 5);
          doc.setFont("Helvetica", "normal");
          y += 8;
        }

        const r = exportRows[i];
        doc.setFontSize(7.5);
        doc.text(String(r["Sl No"]), 12, y + 4);
        doc.text(r["Date & Time"].slice(0, 17), 20, y + 4);
        doc.text(r.Action.slice(0, 25), 60, y + 4);
        doc.text(r["User / Actor"].slice(0, 18), 110, y + 4);
        doc.text(r["Entity / Reference"].slice(0, 28), 140, y + 4);
        doc.text((r.Description || "").slice(0, 50), 195, y + 4);

        y += 6;
      }

      doc.setFontSize(7);
      doc.text(`Page ${doc.getNumberOfPages()}`, 275, 202, { align: "right" });

      const pdfBuf = Buffer.from(doc.output("arraybuffer"));
      return new NextResponse(pdfBuf, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filenameBase}.pdf"`,
        },
      });
    }

    // 3. EXCEL EXPORT (Default)
    const wb = XLSX.utils.book_new();

    // Summary metadata sheet
    const summaryData = [
      { Parameter: "Report Name", Value: "Purchase Enterprise Audit Trail Report" },
      { Parameter: "Exported At", Value: new Date().toLocaleString("en-IN") },
      { Parameter: "Date Filter", Value: from && to ? `${new Date(from).toLocaleString("en-IN")} to ${new Date(to).toLocaleString("en-IN")}` : "All Recorded Events" },
      { Parameter: "Search Filter", Value: search || "All Transactions & Bookings" },
      { Parameter: "Sorting Order", Value: sortOrder === "asc" ? "Chronological (Date & Time Onwards)" : "Reverse Chronological (Newest First)" },
      { Parameter: "Total Events Logged", Value: logs.length },
    ];
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Report Summary");

    // Main Audit Trail Sheet
    const dataWs = XLSX.utils.json_to_sheet(exportRows);
    XLSX.utils.book_append_sheet(wb, dataWs, "Audit Trail Logs");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filenameBase}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Export purchase audit error:", error);
    return NextResponse.json({ error: error.message || "Failed to export audit trail" }, { status: 500 });
  }
}
