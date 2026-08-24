
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");
  const mobile = searchParams.get("mobile");

  // Backward compatibility: if "mobile" param is used (old format)
  if (mobile && !query) {
    try {
      const customer = await prisma.customer.findFirst({
        where: {
          mobile: {
            equals: mobile,
          },
        },
        select: {
          id: true,
          name: true,
          mobile: true,
          address: true,
          city: true,
          gstin: true,
          tags: {
            include: {
              tagDefinition: true,
            },
          },
        },
      });

      return NextResponse.json({ customer });
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }

  // New multi-field search
  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: "Search query must be at least 2 characters" },
      { status: 400 }
    );
  }

  try {
    const searchTerm = query.trim();

    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { mobile: { contains: searchTerm } },
          { gstin: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        mobile: true,
        address: true,
        city: true,
        gstin: true,
        tags: {
          include: {
            tagDefinition: true,
          },
        },
      },
      take: 10,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ customers });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
