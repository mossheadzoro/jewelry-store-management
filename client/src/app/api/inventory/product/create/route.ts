import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../libs/prisma';

export async function POST(req: NextRequest) {
  try {
    const products = await req.json();

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'No products provided' }, { status: 400 });
    }

    const validProducts = products.map((product) => ({
      name: product.name,
      barcode: product.barcode,
      productCode: product.productCode,
      huidNumber: product.huidNumber,
      weight: parseFloat(product.weight),
      purity: parseFloat(product.purity),
      price: parseFloat(product.price),
      quantity: parseInt(product.quantity),
      image:  product.image ? product.image : '', // Ensure it's a valid string
      description: product.description,
      branchId: parseInt(product.branchId),
      subCategoryId: parseInt(product.subCategoryId),
    }));

    const createdProducts = await prisma.productItem.createMany({
      data: validProducts,
    });

    return NextResponse.json(
      { message: `${createdProducts.count} products added successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error adding products:', error);
    return NextResponse.json({ error: 'Failed to add products' }, { status: 500 });
  }
}
