import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    
    // Create new approval
    const approval = await prisma.orderApproval.create({
      data: {
        orderId: params.id,
        status: data.status || "PENDING",
        remarks: data.remarks,
        customerSignature: data.customerSignature,
      }
    });

    return NextResponse.json(approval);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update approval status" }, { status: 500 });
  }
}
