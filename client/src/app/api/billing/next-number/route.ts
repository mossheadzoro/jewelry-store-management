import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchIdStr = searchParams.get("branchId");
    
    if (!branchIdStr) {
      return NextResponse.json({ error: "branchId is required" }, { status: 400 });
    }
    
    const branchId = parseInt(branchIdStr);

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { name: true }
    });
    
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    let fyStartYear, fyEndYear;
    if (month >= 3) { 
      fyStartYear = year;
      fyEndYear = year + 1;
    } else { 
      fyStartYear = year - 1;
      fyEndYear = year;
    }
    const fyString = `${fyStartYear.toString().slice(-2)}-${fyEndYear.toString().slice(-2)}`;
    
    const startOfFY = new Date(fyStartYear, 3, 1);
    const endOfFY = new Date(fyEndYear, 2, 31, 23, 59, 59, 999);

    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        branchId,
        createdAt: {
          gte: startOfFY,
          lte: endOfFY,
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: { invoiceNumber: true }
    });

    let nextSeq = 1;
    
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const parts = lastInvoice.invoiceNumber.split('-');
      if (parts.length >= 3) {
        const lastSeqStr = parts[parts.length - 1];
        const lastSeq = parseInt(lastSeqStr, 10);
        if (!isNaN(lastSeq)) {
          nextSeq = lastSeq + 1;
        }
      }
    }
    
    const sequenceNumberStr = nextSeq.toString().padStart(4, '0');
    const branchPrefix = branch.name.substring(0, 3).toUpperCase();
    const nextInvoiceNumber = `INV-${branchPrefix}-${fyString}-${sequenceNumberStr}`;

    return NextResponse.json({ nextInvoiceNumber });
  } catch (error: any) {
    console.error("Failed to fetch next invoice number:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
