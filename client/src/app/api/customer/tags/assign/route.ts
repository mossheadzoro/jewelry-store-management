import { NextResponse } from "next/server";
import { prisma } from "../../../../../../libs/prisma";

// POST: Manage manual tag assignments for a customer
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerId, tagIds } = body; // tagIds is the array of TagDefinition IDs that should be assigned

    if (!customerId || !Array.isArray(tagIds)) {
      return NextResponse.json(
        { error: "customerId and an array of tagIds are required" },
        { status: 400 }
      );
    }

    // 1. Fetch customer and check existence
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        tags: {
          include: {
            tagDefinition: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // 2. Fetch all manual tag definitions to validate IDs
    const manualDefinitions = await prisma.tagDefinition.findMany({
      where: {
        type: "MANUAL",
        isDeleted: false,
        isActive: true,
      },
    });
    const manualDefIds = new Set(manualDefinitions.map((d) => d.id));

    // Filter input tagIds to only include valid manual tags
    const targetManualTagIds = tagIds.filter((id) => manualDefIds.has(id));

    // 3. Determine additions and removals
    const currentManualAssignments = customer.tags.filter((t) => t.tagDefinition.type === "MANUAL");
    const currentManualDefIds = new Set(currentManualAssignments.map((t) => t.tagDefinitionId));

    const toAdd = targetManualTagIds.filter((id) => !currentManualDefIds.has(id));
    const toRemove = currentManualAssignments.filter((t) => !targetManualTagIds.includes(t.tagDefinitionId));

    // 4. Execute in transactions
    await prisma.$transaction(async (tx) => {
      // Add new assignments
      for (const tagDefId of toAdd) {
        const def = manualDefinitions.find((d) => d.id === tagDefId);
        if (!def) continue;

        await tx.customerTag.create({
          data: {
            customerId,
            tagDefinitionId: tagDefId,
            reason: "Manually assigned",
          },
        });

        await tx.tagAssignmentHistory.create({
          data: {
            customerId,
            tagDefinitionId: tagDefId,
            tagLabel: def.label,
            action: "ADDED",
            reason: "Manually assigned",
          },
        });
      }

      // Remove deleted assignments
      for (const assignment of toRemove) {
        await tx.customerTag.delete({
          where: {
            id: assignment.id,
          },
        });

        await tx.tagAssignmentHistory.create({
          data: {
            customerId,
            tagDefinitionId: assignment.tagDefinitionId,
            tagLabel: assignment.tagDefinition.label,
            action: "REMOVED",
            reason: "Manually removed",
          },
        });
      }
    });

    // 5. Fetch updated tags list to return
    const updatedTags = await prisma.customerTag.findMany({
      where: { customerId },
      include: {
        tagDefinition: true,
      },
    });

    return NextResponse.json({ tags: updatedTags });
  } catch (error) {
    console.error("Assign tags error:", error);
    return NextResponse.json(
      { error: "Failed to assign tags" },
      { status: 500 }
    );
  }
}
