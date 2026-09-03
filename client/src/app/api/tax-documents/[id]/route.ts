// src/app/api/tax-documents/[id]/route.ts
// Tax Document (Credit Note / Debit Note) Retrieval API

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { TaxDocumentService } from "@/lib/services/returns/TaxDocumentService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const resolvedParams = await params;
    const idOrNumber = decodeURIComponent(resolvedParams.id);

    const doc = await TaxDocumentService.getTaxDocument(idOrNumber);

    if (!doc) {
      return NextResponse.json({ error: "Tax document not found." }, { status: 404 });
    }

    return NextResponse.json(doc, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching tax document:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tax document." },
      { status: 500 }
    );
  }
}
