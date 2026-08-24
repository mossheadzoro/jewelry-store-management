import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";





async function fetchAllBranches() {
  try {
    const branches = await prisma.branch.findMany();
    return NextResponse.json(branches);
  } catch (err) {
    console.error("Error fetching branches:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  return fetchAllBranches();
}
