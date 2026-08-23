// client/src/app/api/backups/[id]/restore-preview/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { RestoreService } from "@/lib/backup/services/RestoreService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const userId = parseInt(session.user.id, 10);
    const result = await RestoreService.previewRestore(id, userId);

    return NextResponse.json({
      success: result.success,
      data: result,
    });
  } catch (error: any) {
    console.error("Restore Preview API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute restore preview" },
      { status: 500 }
    );
  }
}
