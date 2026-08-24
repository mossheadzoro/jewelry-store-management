/**
 * POST /api/inventory/year-end-closing
 *
 * Runs the year-end closing process for all active products.
 * Inserts read-only CLOSING_SNAPSHOT ledger entries for each product.
 * Restricted to ADMIN role.
 *
 * Body:
 *   { financialYear: string } // e.g. "2024-25"
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { runYearEndClosing } from "@/lib/yearEndClosing";

export async function POST(req: Request) {
  try {
    // Auth check — only ADMIN can trigger year-end closing
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can run the year-end closing process." },
        { status: 403 }
      );
    }

    // Parse body
    const body = await req.json();
    const { financialYear } = body;

    if (!financialYear || typeof financialYear !== "string") {
      return NextResponse.json(
        { error: "A valid financialYear string (e.g. '2024-25') is required." },
        { status: 400 }
      );
    }

    // Run year-end closing inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      return await runYearEndClosing(tx, financialYear);
    });

    return NextResponse.json({
      success: true,
      result,
      message: `Successfully generated ${result.snapshots} closing snapshots for FY ${financialYear}.`,
    });
  } catch (error: any) {
    console.error("Year-end closing API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute year-end closing." },
      { status: 500 }
    );
  }
}
