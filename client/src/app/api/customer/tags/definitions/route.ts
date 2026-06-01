import { NextResponse } from "next/server";
import { prisma } from "../../../../../../libs/prisma";
import { ensureSystemTagsExist } from "../../../../../lib/services/TagRuleEngine";

// GET: Fetch all active tag definitions
export async function GET(req: Request) {
  try {
    // Make sure default system tags exist
    await ensureSystemTagsExist();

    const definitions = await prisma.tagDefinition.findMany({
      where: {
        isDeleted: false,
        isActive: true,
      },
      orderBy: {
        type: "asc", // SYSTEM first, then MANUAL
      },
    });

    return NextResponse.json({ definitions });
  } catch (error) {
    console.error("Fetch tag definitions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tag definitions" },
      { status: 500 }
    );
  }
}

// POST: Create a custom manual tag definition
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, label, description, color } = body;

    if (!name || !label) {
      return NextResponse.json(
        { error: "Tag name and label are required" },
        { status: 400 }
      );
    }

    const formattedName = name.trim().toUpperCase().replace(/\s+/g, "_");

    // Check if tag already exists
    const existing = await prisma.tagDefinition.findUnique({
      where: { name: formattedName },
    });

    if (existing) {
      if (existing.isDeleted) {
        // Reactivate soft-deleted tag
        const reactivated = await prisma.tagDefinition.update({
          where: { id: existing.id },
          data: {
            label,
            description,
            color: color || "gray",
            isActive: true,
            isDeleted: false,
          },
        });
        return NextResponse.json({ definition: reactivated });
      }
      return NextResponse.json(
        { error: "A tag with this name already exists" },
        { status: 409 }
      );
    }

    const definition = await prisma.tagDefinition.create({
      data: {
        name: formattedName,
        label,
        description,
        color: color || "gray",
        type: "MANUAL",
      },
    });

    return NextResponse.json({ definition });
  } catch (error) {
    console.error("Create tag definition error:", error);
    return NextResponse.json(
      { error: "Failed to create tag definition" },
      { status: 500 }
    );
  }
}
