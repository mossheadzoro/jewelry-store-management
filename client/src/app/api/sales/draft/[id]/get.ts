import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const draftId = params.id;
    if (!draftId) {
      return NextResponse.json({ error: "Draft ID required" }, { status: 400 });
    }

    const draft = await prisma.draftInvoice.findUnique({
      where: { id: draftId },
      include: {
        customer: true,
      },
    });

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    return NextResponse.json({ draft });
  } catch (error: any) {
    console.error("Error fetching draft:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
