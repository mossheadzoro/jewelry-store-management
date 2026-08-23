// client/src/app/api/settings/email/process-queue/route.ts

import { NextRequest, NextResponse } from "next/server";
import { EmailQueueService } from "@/lib/email/queue/EmailQueueService";

export async function POST(req: NextRequest) {
  try {
    const result = await EmailQueueService.processQueue(20);
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process email queue" },
      { status: 500 }
    );
  }
}
