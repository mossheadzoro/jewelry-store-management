// client/src/app/api/settings/email/usage/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { EmailService } from "@/lib/email/services/EmailService";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const branchIdStr = searchParams.get("branchId");
    const branchId = branchIdStr ? parseInt(branchIdStr, 10) : undefined;
    const tenantId = "default-tenant";

    const usage = await EmailService.getEmailUsage(tenantId, branchId);

    return NextResponse.json({
      success: true,
      data: usage,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch email usage" },
      { status: 500 }
    );
  }
}
