import { NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
  }

  try {
    const customerData = await prisma.customer.findUnique({
      where: { id: parseInt(id, 10) },
      select: {
        id: true,
        name: true,
        mobile: true,
        address: true,
        gstin: true,
        tags: {
          include: {
            tagDefinition: true,
          },
        },
        savingSchemes: {
          include: {
            redemptions: true,
            deposits: {
              where: { isBonus: false },
              select: { id: true, cashAmount: true, monthNumber: true }
            }
          }
        },
        invoices: {
          select: {
            balanceAmount: true,
          }
        },
        CustomerWallet: true,
        Order: {
          where: {
            status: { not: "DELIVERED" }
          },
          include: {
            advance: true,
            items: {
              include: {
                category: true
              }
            }
          }
        }
      },
    });

    if (!customerData) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Check if any of the active orders have a corresponding product in the Stamping Center
    const ordersWithStampingStatus = await Promise.all(
      customerData.Order.map(async (order) => {
        const stampingProduct = await prisma.productItem.findFirst({
          where: {
            description: { contains: order.orderNumber, mode: "insensitive" },
            subCategory: {
              category: {
                name: { equals: "STAMPING CENTER", mode: "insensitive" }
              }
            }
          }
        });
        return {
          ...order,
          _isInStampingCenter: !!stampingProduct
        };
      })
    );

    const currentDue = customerData.invoices.reduce((acc: number, inv: any) => acc + (inv.balanceAmount || 0), 0);
    const { invoices, Order, ...customer } = customerData;

    return NextResponse.json({ 
      customer: { 
        ...customer, 
        currentDue, 
        Order: ordersWithStampingStatus 
      } 
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
