import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const searchTerm = searchParams.get("search")?.toLowerCase();
  const branchIdParam = searchParams.get("branchId");

  if (!branchIdParam) {
    return NextResponse.json({ error: "Missing branchId" }, { status: 400 });
  }

  const branchId = parseInt(branchIdParam);

  try {
    const products = await prisma.productItem.findMany({
      where: {
        branchId,
        ...(searchTerm && {
          name: {
            contains: searchTerm,
            mode: "insensitive",
          },
        }),
      },
      select: {
        id: true,
        name: true,
        gsWeight: true,
        ntWeight: true,
        purity: true,
        barcode: true,
        branch: {
          select: {
            id: true,
            name: true,
          }
        },
        subCategory: {
          select: {
            id: true,
            name: true,
            category: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    });

    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      gsWeight: product.gsWeight,
      ntWeight: product.ntWeight,
      purity: product.purity,
      barcode: product.barcode,
      branch: {
        id: product.branch.id,
        name: product.branch.name,
      },
      subCategory: {
        id: product.subCategory?.id,
        name: product.subCategory?.name,
      },
      category: {
        id: product.subCategory?.category?.id,
        name: product.subCategory?.category?.name,
      },
    }));

    return NextResponse.json(formattedProducts);
  } catch (error: any) {
    console.error("Fetch error:", error.message || error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  } 
}
