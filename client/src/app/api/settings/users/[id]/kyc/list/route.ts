import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { StaffKycService } from "@/lib/services/StaffKycService";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = parseInt(params.id, 10);
    const { documents, kycStatus, hasPan, hasAadhar } = await StaffKycService.getStaffDocuments(
      userId
    );

    return NextResponse.json({
      documents,
      kycStatus,
      hasPan,
      hasAadhar,
    });
  } catch (error) {
    console.error("Failed to list staff KYC documents:", error);
    return NextResponse.json({ error: "Failed to list documents" }, { status: 500 });
  }
}
