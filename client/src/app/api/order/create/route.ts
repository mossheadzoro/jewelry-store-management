import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Prisma } from "@prisma/client";
import crypto from "crypto";

/* ---------- HELPER: generate unique slip number ---------- */
function generateSlipNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I,O,0,1 to avoid confusion
  let result = "ADV-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function getUniqueSlipNumber(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const slip = generateSlipNumber();
    const existing = await prisma.advance.findUnique({
      where: { advanceReceiptNumber: slip },
    });
    if (!existing) return slip;
    attempts++;
  }
  // Fallback: use timestamp-based
  return `ADV-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

/* ---------- HELPER: generate order number ---------- */
async function getNextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const lastOrder = await prisma.order.findFirst({
    where: {
      orderNumber: { startsWith: `ORD-${year}` },
    },
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
  });

  let seq = 1;
  if (lastOrder) {
    const parts = lastOrder.orderNumber.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `ORD-${year}-${seq.toString().padStart(4, "0")}`;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const customerName = formData.get("customerName") as string;
    const customerMobile = formData.get("customerMobile") as string;
    const karigarId = (formData.get("karigarId") as string) || null;
    
    // Advance fields
    const advanceAmount = Number(formData.get("advanceAmount")) || 0;
    const paymentMethod = (formData.get("paymentMethod") as any) || "CASH";
    const paymentRef = (formData.get("paymentRef") as string) || null;
    
    const advanceMetal = Number(formData.get("advanceMetal")) || 0;
    const metalPurity = (formData.get("metalPurity") as string) || "22K";
    const metalType = (formData.get("metalType") as any) || "GOLD";
    const metalSource = (formData.get("metalSource") as string) || "PHYSICAL";
    
    const priority = (formData.get("priority") as string) || "STANDARD";
    const notes = (formData.get("notes") as string) || null;
    const branchId = Number(formData.get("branchId"));
    const wholesalerId = (formData.get("wholesalerId") as string) || null;
    const deliveryDateRaw = formData.get("deliveryDate") as string;
    const deliveryDate = deliveryDateRaw ? new Date(deliveryDateRaw) : new Date();

    /* ---------- PARSE ITEMS ---------- */
    const itemsRaw = formData.get("items") as string;
    let items: Array<{
      categoryId: number;
      weight?: number;
      measurement?: string;
      description?: string;
      imageFile?: File;
    }> = [];

    if (itemsRaw) {
      items = JSON.parse(itemsRaw);
    } else {
      // Fallback for single-item (backward compat)
      const categoryId = Number(formData.get("categoryId"));
      const description = formData.get("description") as string;
      const weight = formData.get("weight") as string;
      const measurement = formData.get("measurement") as string;
      if (categoryId) {
        items = [
          {
            categoryId,
            description,
            weight: weight ? Number(weight) : undefined,
            measurement,
          },
        ];
      }
    }

    /* ---------- MEDIA UPLOADS ---------- */
    const itemAssets: { images: string[]; voiceUrl: string | null }[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const currentAssets: { images: string[]; voiceUrl: string | null } = { images: [], voiceUrl: null };
      
      // Upload images for this item (up to 5)
      for (let j = 0; j < 5; j++) {
        const file = formData.get(`image_${i}_${j}`) as File | null;
        if (file && file.size > 0) {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const uploadResult = await new Promise<any>((resolve, reject) => {
            cloudinary.uploader
              .upload_stream(
                { folder: "orders", resource_type: "image" },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              )
              .end(buffer);
          });
          currentAssets.images.push(uploadResult.secure_url);
        }
      }
      
      // Backward compat check
      if (currentAssets.images.length === 0) {
        const file = formData.get(`image_${i}`) as File | null;
        if (file && file.size > 0) {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const uploadResult = await new Promise<any>((resolve, reject) => {
            cloudinary.uploader.upload_stream({ folder: "orders", resource_type: "image" }, (error, result) => {
              if (error) reject(error); else resolve(result);
            }).end(buffer);
          });
          currentAssets.images.push(uploadResult.secure_url);
        } else if (i === 0) {
          const singleFile = formData.get("image") as File | null;
          if (singleFile && singleFile.size > 0) {
            const bytes = await singleFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const uploadResult = await new Promise<any>((resolve, reject) => {
              cloudinary.uploader.upload_stream({ folder: "orders", resource_type: "image" }, (error, result) => {
                if (error) reject(error); else resolve(result);
              }).end(buffer);
            });
            currentAssets.images.push(uploadResult.secure_url);
          }
        }
      }
      
      // Upload voice for this item
      const voiceFile = formData.get(`voice_${i}`) as File | null;
      if (voiceFile && voiceFile.size > 0) {
        const bytes = await voiceFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadResult = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              { folder: "orders/voice", resource_type: "video" }, // Cloudinary uses "video" for audio
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            )
            .end(buffer);
        });
        currentAssets.voiceUrl = uploadResult.secure_url;
      }
      
      itemAssets.push(currentAssets);
    }

    /* ---------- CUSTOMER LOOKUP / CREATE ---------- */
    let customerId: number | null = null;
    const existingCustomer = await prisma.customer.findUnique({
      where: { mobile: customerMobile },
    });

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const newCustomer = await prisma.customer.create({
        data: {
          name: customerName || "Walk-in Customer",
          mobile: customerMobile,
          address: "",
          city: "",
          state: "",
          pincode: "",
          gender: "OTHER",
        },
      });
      customerId = newCustomer.id;
    }

    /* ---------- AUTH ---------- */
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = Number(session.user.id);

    /* ---------- GENERATE UNIQUE IDS ---------- */
    const orderNumber = await getNextOrderNumber();
    const advanceSlipNumber = await getUniqueSlipNumber();

    /* ---------- DETERMINE STATUS ---------- */
    const status = (karigarId || wholesalerId) ? "ASSIGNED" : "CREATED";

    /* ---------- PREPARE ADVANCE CREATION ---------- */
    let advanceCreate: any = undefined;
    if (advanceAmount > 0 || advanceMetal > 0) {
      advanceCreate = {
        create: {
          advanceReceiptNumber: advanceSlipNumber,
          customer: { connect: { id: customerId } },
          moneyAmount: advanceAmount,
          paymentMethod: advanceAmount > 0 ? paymentMethod : null,
          paymentRef: advanceAmount > 0 ? paymentRef : null,
          metalType: advanceMetal > 0 ? metalType : null,
          metalWeight: advanceMetal,
          metalPurity: advanceMetal > 0 ? metalPurity : null,
        }
      };
    }

    /* ---------- CREATE ORDER ---------- */
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName,
        customerMobile,
        karigarId: karigarId || undefined,
        wholesalerId: wholesalerId || undefined,
        priority: priority as any,
        notes,
        deliveryDate,
        status: status as any,
        branchId,
        userId,
        customerId,
        advance: advanceCreate,
        items: {
          create: items.map((item, idx) => ({
            categoryId: item.categoryId,
            description: item.description || "",
            weight: item.weight ? new Prisma.Decimal(item.weight) : null,
            measurement: item.measurement || "",
            images: itemAssets[idx]?.images || [],
            voiceUrl: itemAssets[idx]?.voiceUrl || null,
          })),
        },
      },
      include: {
        karigar: { select: { id: true, name: true, department: true } },
        customer: { select: { id: true, name: true, mobile: true } },
        advance: true,
        items: {
          include: {
            category: { select: { id: true, name: true } },
          },
        },
      },
    });

    /* ---------- WALLET PAYMENTS & COLLATERAL ---------- */
    if (customerId) {
      const walletId = `WAL-${customerId}`;
      
      // 1. Deduct Cash Advance from Wallet
      if (advanceAmount > 0 && paymentMethod === "WALLET") {
        await prisma.customerWallet.update({
          where: { customerId },
          data: { cashBalance: { decrement: advanceAmount }, updatedAt: new Date() }
        }).catch(() => null);

        await prisma.customerWalletLedger.create({
          data: {
            id: `CWL-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            walletId,
            transactionType: "DEBIT",
            assetType: "CASH",
            amount: advanceAmount,
            description: `Cash Advance used for Order ${orderNumber}`,
            relatedEntityId: order.id
          }
        });
      }

      // 2. Deduct Metal Advance from Wallet
      if (advanceMetal > 0 && metalSource === "WALLET") {
        const updateField = metalPurity === "24K" ? "metal24KBalance" : "metal22KBalance";
        await prisma.customerWallet.update({
          where: { customerId },
          data: { [updateField]: { decrement: advanceMetal }, updatedAt: new Date() }
        }).catch(() => null);

        await prisma.customerWalletLedger.create({
          data: {
            id: `CWL-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            walletId,
            transactionType: "DEBIT",
            assetType: `METAL_${metalPurity}`,
            amount: advanceMetal,
            description: `Metal Advance used for Order ${orderNumber}`,
            relatedEntityId: order.id
          }
        });
      }
    }

    // If Physical Metal Advance is received at counter, increase branch stock
    if (advanceMetal > 0 && metalSource === "PHYSICAL") {
      let rawProduct = await prisma.productItem.findFirst({ where: { name: "Old Gold Stock", branchId } });
      if (rawProduct) {
        await prisma.inventoryLedger.create({
          data: {
            productId: rawProduct.id,
            branchId,
            txnType: "OLD_GOLD_IN",
            refType: "ORDER",
            refId: order.id,
            qtyIn: 0,
            qtyOut: 0,
            grossWeightIn: 0,
            netWeightIn: 0,
            fineWeightIn: advanceMetal,
            remarks: `Physical Metal Advance for ${orderNumber}`,
          }
        });
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
