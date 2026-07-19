import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://gold-rate-api-rho.vercel.app/api/gold-rates", {
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!res.ok) {
      throw new Error("Failed to fetch from external API");
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in gold-rates proxy API:", error);
    return NextResponse.json({ error: "Failed to fetch live gold rates" }, { status: 500 });
  }
}
