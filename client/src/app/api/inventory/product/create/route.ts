// // src/app/api/inventory/product/create/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '../../../../../../libs/prisma';
// import { z } from 'zod';

// // Define Zod schemas for validation
// const stoneSchema = z.object({
//   carat: z.string().optional(),
//   weight:z.number().min(0,"Weight is Required"),
//   name: z.string().optional(),
//   price: z.string().optional(),
//   color: z.string().optional(), // e.g., "Fancy Yellow", "White"
//   colorGrade: z.string().optional(), // e.g., "D", "J" for diamonds
//   clarity: z.string().optional(), // e.g., "VVS1", "SI2"
//   cut: z.string().optional(), // e.g., "Excellent", "Good" (cut quality)
//   shape: z.string().optional(), // e.g., "Round", "Emerald" (physical shape)
//   origin: z.string().optional(), // e.g., "Mozambique", "Myanmar"
//   treatment: z.string().optional(), // e.g., "Heat-treated", "None"
//   certification: z.string().optional(), // e.g., "GIA", "AGS"
//   quality: z.string().optional(), // e.g., "Premium", "Commercial"
//   quantity: z.number().min(1, "Minimum 1 Quantity is required"), // total price for quantity
//   stoneImageUrl: z.string().optional(), // URL to the image of the stone
//   certImageUrl: z.string().optional(),
//   // Add other stone fields here as needed based on your Prisma schema
// });

// const productSchema = z.object({
//   name: z.string().min(1, 'Name is required'),
//   barcode: z.string().min(1, 'Barcode is required'),
//   productCode: z.string().optional(),
//   huidNumber: z.string().optional(),
//   gsWeight: z.string().min(1, 'Gross Weight is required'),
//   ntWeight: z.string().min(1, 'Net Weight is required'),
//   purity: z.string().min(1, 'Purity is required'),
//   price: z.string().optional(),
//   quantity: z.number().min(1, 'Quantity is required'),
//   image: z.string().optional(),
//   description: z.string().optional(),
//   branchId: z.number().min(1, 'Branch is required'),
//   subCategoryId: z.number().min(0, 'Subcategory is required'), // Corrected to number
//   otherCharges: z.string().optional(),
//   otherChargesPrice: z.number().min(1, "Invalid OtherCharges").optional(),
//   stoneDetails: z.array(stoneSchema).optional(),
// });

// export async function POST(req: NextRequest) {
//   try {
//     const rawProducts = await req.json();
//     console.log("Raw products:", rawProducts);
//     const parsedProducts = z.array(productSchema).safeParse(rawProducts);
//     console.log("Parsed products:", parsedProducts);
//     if (!parsedProducts.success) {
//       return NextResponse.json(
//         { 
//           error: 'Invalid product data',
//           details: parsedProducts.error.flatten() 
//         },
//         { status: 400 }
//       );
//     }

//     const createdProducts = await prisma.$transaction(
//       parsedProducts.data.map((product) => {
//         const { stoneDetails, branchId, subCategoryId, ...productData } = product;

//         const dataForPrisma = {
//           ...productData,
//           gsWeight: parseFloat(productData.gsWeight),
//           ntWeight: parseFloat(productData.ntWeight),
//           purity: parseFloat(productData.purity),
//            price: productData.price ? parseFloat(productData.price) : null,
//           quantity: Number(productData.quantity),
//           otherCharges: productData.otherCharges || null,
//           otherChargesPrice: productData.otherChargesPrice || null,

//           // Connect to the existing Branch and SubCategory using their IDs
//           branch: {
//             connect: { id: branchId },
//           },
//           subCategory: {
//             connect: { id: subCategoryId },
//           },
//         };
        
//         if (stoneDetails && stoneDetails.length > 0) {
//           return prisma.productItem.create({ // Ensure 'ProductItem' is the correct model name
//             data: {
//               ...dataForPrisma,
//               stoneDetails: { // Use the correct field name for the nested relation
//                 create: stoneDetails.map((stone) => ({
//                   ...stone,
//                   quantity: Number(stone.quantity),
//                   price: stone.price ? parseFloat(stone.price) : null,
//                   weight: Number(stone.weight), // Ensure weight is a number
//                 })),
//               },
//             },
//           });
//         } else {
//           return prisma.productItem.create({ // Ensure 'ProductItem' is the correct model name
//             data: dataForPrisma,
//           });
//         }
//       })
//     );
    
//     return NextResponse.json(
//       { 
//         message: `${createdProducts.length} products added successfully`, 
//         products: createdProducts 
//       },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error('Error adding products:', error);
//     return NextResponse.json({ error: 'Failed to add products' }, { status: 500 });
//   }
// }

// src/app/api/inventory/product/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../libs/prisma';
import { insertLedgerEntry } from '../../../../../../libs/inventoryLedger';
import { type } from 'arktype';

// Stone schema
const stoneSchema = type({
    carat: 'string?',
    weight: 'number|string >0',
    name: 'string?',
    price: 'string?',
    color: 'string?',
    colorGrade: 'string?',
    clarity: 'string?',
    cut: 'string?',
    shape: 'string?',
    origin: 'string?',
    treatment: 'string?',
    certification: 'string?',
    quality: 'string?',
    quantity: 'number>0',
    stoneImageUrl: 'string?',
    certImageUrl: 'string?'
});

// Product schema
const productSchema = type({
    name: 'string>0',
    barcode: 'string>0',
    productCode: 'string?',
    huidNumber: 'string?',
    gsWeight: 'string>0',
    ntWeight: 'string>0',
    purity: 'string>0',
    price: 'string?',
    quantity: 'number>0',
    image: 'string?',
    description: 'string?',
    branchId: 'number>0',
    subCategoryId: 'number>=0',
    otherCharges: 'string?',
    otherChargesPrice: 'number|string>0?',
    stoneDetails: stoneSchema.array().optional()
});

export async function POST(req: NextRequest) {
    try {
        const rawProducts = await req.json();
        console.log('Raw products:', rawProducts);

        const parsedProducts = productSchema.array().assert(rawProducts);

        const createdProducts = await prisma.$transaction(async (tx: any) => {
            const results = [];

            for (const product of parsedProducts) {
                const { stoneDetails, branchId, subCategoryId, ...productData } = product;

                const dataForPrisma = {
                    ...productData,
                    gsWeight: parseFloat(productData.gsWeight),
                    ntWeight: parseFloat(productData.ntWeight),
                    purity: parseFloat(productData.purity),
                    price: productData.price ? parseFloat(productData.price) : null,
                    quantity: Number(productData.quantity),
                    otherCharges: productData.otherCharges || null,
                    otherChargesPrice: Number(productData.otherChargesPrice) || null,
                    branch: {
                        connect: { id: branchId }
                    },
                    subCategory: {
                        connect: { id: subCategoryId }
                    }
                };

                let created;
                if (stoneDetails && stoneDetails.length > 0) {
                    created = await tx.productItem.create({
                        data: {
                            ...dataForPrisma,
                            stoneDetails: {
                                create: stoneDetails.map((stone: any) => ({
                                    ...stone,
                                    quantity: Number(stone.quantity),
                                    price: stone.price ? parseFloat(stone.price) : null,
                                    weight: stone.weight ? parseFloat(stone.weight.toString()) : null
                                }))
                            }
                        }
                    });
                } else {
                    created = await tx.productItem.create({
                        data: dataForPrisma
                    });
                }

                // 📒 Auto Ledger: PURCHASE_IN
                await insertLedgerEntry(tx, {
                    productId: created.id,
                    branchId,
                    txnType: "PURCHASE_IN",
                    refType: "PURCHASE",
                    refId: created.id.toString(),
                    qtyIn: Number(productData.quantity),
                    grossWeightIn: parseFloat(productData.gsWeight),
                    netWeightIn: parseFloat(productData.ntWeight),
                    unitCost: productData.price ? parseFloat(productData.price) : undefined,
                    remarks: `Product added: ${productData.name}`,
                });

                results.push(created);
            }

            return results;
        });

        return NextResponse.json(
            {
                message: `${createdProducts.length} products added successfully`,
                products: createdProducts
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error adding products:', error);
        return NextResponse.json({ error: 'Failed to add products' }, { status: 500 });
    }
}
