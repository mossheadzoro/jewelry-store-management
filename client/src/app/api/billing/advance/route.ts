import { NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const receiptNo = searchParams.get("receiptNo");

    if (!receiptNo) {
      return NextResponse.json(
        { error: "receiptNo is required" },
        { status: 400 }
      );
    }

    const advance = await prisma.advance.findUnique({
      where: { advanceReceiptNumber: receiptNo },
      include: {
        customer: { select: { id: true, name: true, mobile: true } }
      }
    });

    if (!advance) {
      return NextResponse.json(
        { error: "Advance receipt not found" },
        { status: 404 }
      );
    }

    if (advance.isApplied) {
      return NextResponse.json(
        { error: "This advance has already been applied" },
        { status: 400 }
      );
    }

    return NextResponse.json({ advance });
  } catch (error) {
    console.error("Advance fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch advance" },
      { status: 500 }
    );
  }
}
