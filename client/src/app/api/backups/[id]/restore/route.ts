// client/src/app/api/backups/[id]/restore/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { RestoreService } from "@/lib/backup/services/RestoreService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized. Critical action: Admin role is required for production database restore." },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const confirmation = body.confirmation;

    if (confirmation !== "CONFIRM_RESTORE") {
      return NextResponse.json(
        { error: "Invalid confirmation token. You must explicitly confirm the production restore." },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id, 10);
    const result = await RestoreService.executeProductionRestore(id, userId, userId);

    return NextResponse.json({
      success: true,
      message: `Production database restored successfully from backup ${id}!`,
      data: result,
    });
  } catch (error: any) {
    console.error("Production Restore API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute production restore" },
      { status: 500 }
    );
  }
}
