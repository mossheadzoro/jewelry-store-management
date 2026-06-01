import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const createdById = session?.user?.id ? parseInt(session.user.id) : 1;

    const body = await req.json();
    const { branchId, dateFrom, dateTo, format, includes } = body;

    const parsedBranchId = parseInt(branchId || "0");
    if (!parsedBranchId) {
      return NextResponse.json({ error: "branchId is required" }, { status: 400 });
    }

    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const backupData: any = {};

    // 1. Fetch Invoices
    if (includes.includes("invoices")) {
      backupData.invoices = await prisma.invoice.findMany({
        where: {
          branchId: parsedBranchId,
          ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
        },
        orderBy: { createdAt: "desc" }
      });
    }

    // 2. Fetch Payments
    if (includes.includes("payments")) {
      backupData.payments = await prisma.invoicePayment.findMany({
        where: {
          invoice: {
            branchId: parsedBranchId,
            ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
          }
        },
        orderBy: { paidAt: "desc" }
      });
    }

    // 3. Fetch Customers
    if (includes.includes("customers")) {
      backupData.customers = await prisma.customer.findMany({
        orderBy: { name: "asc" }
      });
    }

    // 4. Fetch Stock Movements
    if (includes.includes("stock")) {
      backupData.stock = await prisma.inventoryLedger.findMany({
        where: {
          branchId: parsedBranchId,
          ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
        },
        orderBy: { createdAt: "desc" }
      });
    }

    // 5. Fetch Karigar Jobs
    if (includes.includes("karigar")) {
      backupData.karigar = await prisma.karigarJob.findMany({
        orderBy: { createdAt: "desc" }
      });
    }

    let responseBuffer: Buffer;
    let contentType = "application/json";
    let filename = `backup_${parsedBranchId}_${Date.now()}`;

    if (format === "json") {
      const jsonStr = JSON.stringify(backupData, null, 2);
      responseBuffer = Buffer.from(jsonStr);
      contentType = "application/json";
      filename += ".json";
    } else {
      // excel format
      const wb = XLSX.utils.book_new();

      if (backupData.invoices) {
        const sheet = XLSX.utils.json_to_sheet(backupData.invoices.map((inv: any) => ({
          ...inv,
          createdAt: new Date(inv.createdAt).toISOString(),
          updatedAt: new Date(inv.updatedAt).toISOString(),
        })));
        XLSX.utils.book_append_sheet(wb, sheet, "Invoices");
      }
      if (backupData.payments) {
        const sheet = XLSX.utils.json_to_sheet(backupData.payments.map((p: any) => ({
          ...p,
          paidAt: new Date(p.paidAt).toISOString(),
        })));
        XLSX.utils.book_append_sheet(wb, sheet, "Payments");
      }
      if (backupData.customers) {
        const sheet = XLSX.utils.json_to_sheet(backupData.customers);
        XLSX.utils.book_append_sheet(wb, sheet, "Customers");
      }
      if (backupData.stock) {
        const sheet = XLSX.utils.json_to_sheet(backupData.stock.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt).toISOString(),
        })));
        XLSX.utils.book_append_sheet(wb, sheet, "Stock Movements");
      }
      if (backupData.karigar) {
        const sheet = XLSX.utils.json_to_sheet(backupData.karigar.map((k: any) => ({
          ...k,
          createdAt: new Date(k.createdAt).toISOString(),
          closedAt: k.closedAt ? new Date(k.closedAt).toISOString() : "",
        })));
        XLSX.utils.book_append_sheet(wb, sheet, "Karigar Jobs");
      }

      responseBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      filename += ".xlsx";
    }

    // Save BackupLog entry to database
    await prisma.backupLog.create({
      data: {
        branchId: parsedBranchId,
        format: format.toUpperCase(),
        sizeBytes: responseBuffer.length,
        includes,
        createdById
      }
    });

    return new NextResponse(responseBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });

  } catch (error: any) {
    console.error("Backup failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate system backup" },
      { status: 500 }
    );
  }
}
