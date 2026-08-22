// client/src/app/api/rfid/billing-scan/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@libs/prisma';
import { requireAuth } from '@/lib/authGuard';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { requireBranch: true });
    if ('error' in auth && auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const branchId = auth.branchId!;
    const body = await req.json();
    const { epcs } = body;

    if (!epcs || !Array.isArray(epcs) || epcs.length === 0) {
      return NextResponse.json({ error: 'No RFID EPCs provided' }, { status: 400 });
    }

    const cleanEpcs = epcs.map((e: string) => e.trim().toUpperCase());

    const tags = await prisma.rFIDTag.findMany({
      where: {
        epc: { in: cleanEpcs },
      },
      include: {
        currentZone: true,
        productItem: {
          include: {
            subCategory: { include: { category: true } },
            stoneDetails: true,
          },
        },
      },
    });

    const tagMap = new Map(tags.map((t) => [t.epc, t]));

    const validItems: any[] = [];
    const invalidItems: any[] = [];

    for (const epc of cleanEpcs) {
      const tag = tagMap.get(epc);

      if (!tag || !tag.productItem) {
        invalidItems.push({
          epc,
          reason: 'Unassigned RFID Tag — not linked to any product item',
          canAdd: false,
        });
        continue;
      }

      const item = tag.productItem;

      if (tag.status !== 'ACTIVE') {
        invalidItems.push({
          epc,
          productName: item.name,
          productCode: item.productCode,
          reason: `Tag status is ${tag.status}`,
          canAdd: false,
        });
        continue;
      }

      if (item.branchId !== branchId) {
        invalidItems.push({
          epc,
          productName: item.name,
          productCode: item.productCode,
          reason: 'Item belongs to a different branch',
          canAdd: false,
        });
        continue;
      }

      if (item.quantity <= 0) {
        invalidItems.push({
          epc,
          productName: item.name,
          productCode: item.productCode,
          reason: 'Item is out of stock or already sold',
          canAdd: false,
        });
        continue;
      }

      if (item.reservedQty >= item.quantity) {
        invalidItems.push({
          epc,
          productName: item.name,
          productCode: item.productCode,
          reason: 'Item is currently reserved for an order',
          canAdd: false,
        });
        continue;
      }

      // Valid item ready for billing cart
      validItems.push({
        id: item.id,
        name: item.name,
        barcode: item.barcode,
        productCode: item.productCode,
        huidNumber: item.huidNumber,
        category: item.subCategory?.category?.name,
        subCategory: item.subCategory?.name,
        gsWeight: item.gsWeight,
        ntWeight: item.ntWeight,
        purity: item.purity,
        price: item.price,
        epc: tag.epc,
        zoneName: tag.currentZone?.name || 'Showroom',
        canAdd: true,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalScanned: cleanEpcs.length,
        validCount: validItems.length,
        invalidCount: invalidItems.length,
        validItems,
        invalidItems,
      },
    });
  } catch (error: any) {
    console.error('Billing RFID Scan API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process billing RFID scan' }, { status: 500 });
  }
}
