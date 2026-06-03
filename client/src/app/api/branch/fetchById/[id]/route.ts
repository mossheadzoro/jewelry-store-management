import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "../../../../../../libs/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const paramsId = resolvedParams.id;
  const id = Number(paramsId);

  if (!id) {
    return NextResponse.json({ error: "Branch ID is required" }, { status: 400 });
  }

  try {
    const branch = await prisma.branch.findUnique({
      where: { id },
    });

    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    return NextResponse.json(branch);
  } catch (err) {
    console.error("Error fetching branch:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}