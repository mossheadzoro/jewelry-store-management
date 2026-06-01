import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import { prisma } from "../../../../../libs/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name, address, city, state,
      pincode, country, phone, email,
    } = body;
console.log('Creating branch with data:', body);
    if (!name || !email) {
      return NextResponse.json(
        { error: "Branch name and email are required" },
        { status: 400 }
      );
    }

    const newBranch = await prisma.branch.create({
      data: {
        name,
        address,
        city,
        state,
        pincode,
        country,
        phone,
        email,
      },
    });
console.log('Branch created:', newBranch);
    return NextResponse.json(newBranch, { status: 201 });
  } catch (err) {
    console.error("Error creating branch:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
