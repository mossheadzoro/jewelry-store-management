// ============================================================================
// Related Records API — /api/search/related
// ============================================================================
// GET /api/search/related?entityType=invoice&entityId=123
// Returns linked entities for the "Related Records" feature
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from "@/lib/prisma";
import { RelatedEntity, SearchEntityType } from '@/lib/types/search';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entityType = req.nextUrl.searchParams.get('entityType') as SearchEntityType;
    const entityId = req.nextUrl.searchParams.get('entityId');

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entityType and entityId are required' }, { status: 400 });
    }

    let related: RelatedEntity[] = [];

    switch (entityType) {
      case 'invoice':
        related = await getInvoiceRelated(parseInt(entityId, 10));
        break;
      case 'order':
        related = await getOrderRelated(entityId);
        break;
      case 'customer':
        related = await getCustomerRelated(parseInt(entityId, 10));
        break;
      case 'product':
        related = await getProductRelated(parseInt(entityId, 10));
        break;
      default:
        break;
    }

    return NextResponse.json({ related });
  } catch (error) {
    console.error('Related search error:', error);
    return NextResponse.json({ error: 'Failed to load related records' }, { status: 500 });
  }
}

async function getInvoiceRelated(invoiceId: number): Promise<RelatedEntity[]> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      customer: { select: { id: true, name: true } },
      items: {
        select: {
          product: { select: { id: true, name: true, productCode: true } },
        },
      },
      payments: {
        select: { id: true, method: true, amount: true },
      },
      branch: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  if (!invoice) return [];

  const related: RelatedEntity[] = [];

  // Customer
  if (invoice.customer) {
    related.push({
      id: invoice.customer.id,
      entityType: 'customer',
      title: invoice.customer.name,
      navigationUrl: `/customer/${invoice.customer.id}`,
    });
  }

  // Products
  invoice.items.forEach((item: any) => {
    related.push({
      id: item.product.id,
      entityType: 'product',
      title: item.product.name,
      subtitle: item.product.productCode,
      navigationUrl: `/inventory`,
    });
  });

  return related;
}

async function getOrderRelated(orderId: string): Promise<RelatedEntity[]> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      customer: { select: { id: true, name: true } },
      karigar: { select: { id: true, name: true } },
      items: {
        select: {
          id: true,
          category: { select: { name: true } },
          description: true,
        },
      },
    },
  });

  if (!order) return [];

  const related: RelatedEntity[] = [];

  if (order.customer) {
    related.push({
      id: order.customer.id,
      entityType: 'customer',
      title: order.customer.name,
      navigationUrl: `/customer/${order.customer.id}`,
    });
  }

  if (order.karigar) {
    related.push({
      id: order.karigar.id,
      entityType: 'karigar',
      title: order.karigar.name,
      navigationUrl: `/karigar`,
    });
  }

  return related;
}

async function getCustomerRelated(customerId: number): Promise<RelatedEntity[]> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      invoices: {
        select: { id: true, invoiceNumber: true, totalAmount: true },
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
      Order: {
        select: { id: true, orderNumber: true, status: true },
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!customer) return [];

  const related: RelatedEntity[] = [];

  customer.invoices.forEach((inv: any) => {
    related.push({
      id: inv.id,
      entityType: 'invoice',
      title: inv.invoiceNumber,
      subtitle: `₹${inv.totalAmount?.toLocaleString('en-IN')}`,
      navigationUrl: `/sales`,
    });
  });

  customer.Order.forEach((ord: any) => {
    related.push({
      id: ord.id,
      entityType: 'order',
      title: ord.orderNumber,
      subtitle: ord.status,
      navigationUrl: `/orderBook`,
    });
  });

  return related;
}

async function getProductRelated(productId: number): Promise<RelatedEntity[]> {
  const product = await prisma.productItem.findUnique({
    where: { id: productId },
    select: {
      branch: { select: { id: true, name: true } },
      subCategory: {
        select: {
          name: true,
          category: { select: { name: true } },
        },
      },
    },
  });

  if (!product) return [];

  return [];
}
