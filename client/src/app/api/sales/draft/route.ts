import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { insertLedgerEntry } from "@/lib/inventoryLedger"; // Adjust path if needed

// POST: Create or Update a Draft (Pause Billing)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { branchId, customerId, billingData, draftId } = body;

    if (!branchId || !billingData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Set expiration to 1 hour from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const draftNumber = `DRF-${Date.now().toString().slice(-6)}`;

    const draft = await prisma.$transaction(async (tx) => {
      let draftRecord;

      if (draftId) {
        draftRecord = await tx.draftInvoice.update({
          where: { id: draftId },
          data: {
            customerId: customerId || null,
            billingData: JSON.stringify(billingData),
            expiresAt,
          },
        });
      } else {
        draftRecord = await tx.draftInvoice.create({
          data: {
            draftNumber,
            branchId: Number(branchId),
            customerId: customerId ? Number(customerId) : null,
            billingData: JSON.stringify(billingData),
            expiresAt,
          },
        });
      }

      // Reserve stock for products in the cart
      // To avoid double-reserving on update, we should track what's already reserved
      // But for simplicity in a quick implementation, draft updates usually mean overwriting.
      // Ideally, a paused draft isn't "updated" continuously; it's saved once.
      // If it IS updated, we'd need to reconcile `RESERVE_OUT`.
      // Let's assume we just reserve what's new. Actually, since this is a draft pause,
      // it's called once when they click Pause or navigate away.
      // Let's get the products from the billingData
      const products = billingData.products || [];

      for (const item of products) {
        // If this product was already reserved by this draft, we could skip it.
        // But for simplicity, we assume this is a fresh pause.
        // A robust way is to check InventoryLedger for this draft.
        const existingReservation = await tx.inventoryLedger.findFirst({
          where: {
            refType: "SYSTEM",
            refId: draftRecord.id,
            productId: item.productId || item.id,
          },
        });

        if (!existingReservation) {
          // Increment reserved stock (but do NOT decrement quantity, as that happens on final sale)
          await tx.productItem.update({
            where: { id: item.productId || item.id },
            data: {
              reservedQty: { increment: 1 },
            },
          });

          // Write ledger entry for RESERVE_OUT (with 0 qtyOut so it doesn't affect balance but logs the reservation)
          await insertLedgerEntry(tx, {
            productId: item.productId || item.id,
            branchId: Number(branchId),
            txnType: "RESERVE_OUT",
            refType: "SYSTEM",
            refId: draftRecord.id,
            qtyOut: 0,
            netWeightOut: 0,
            grossWeightOut: 0,
            remarks: "Paused Bill Auto-Reservation",
          });
        }
      }

      return draftRecord;
    });

    return NextResponse.json({ success: true, draft });
  } catch (error: any) {
    console.error("Error saving draft:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: Fetch Drafts (and lazily auto-cancel expired ones)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    if (!branchId) {
      return NextResponse.json({ error: "Branch ID required" }, { status: 400 });
    }

    const now = new Date();

    // 1. Lazy cleanup: Find expired drafts
    const expiredDrafts = await prisma.draftInvoice.findMany({
      where: {
        expiresAt: { lt: now },
      },
    });

    if (expiredDrafts.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const draft of expiredDrafts) {
          // Release stock by finding reservations
          const reservations = await tx.inventoryLedger.findMany({
            where: {
              refType: "SYSTEM",
              refId: draft.id,
              txnType: "RESERVE_OUT",
            },
          });

          for (const res of reservations) {
            // Restore product quantities
            await tx.productItem.update({
              where: { id: res.productId },
              data: {
                quantity: { increment: res.qtyOut ?? 1 },
                reservedQty: { decrement: res.qtyOut ?? 1 },
              },
            });

            // Write RESERVE_IN ledger entry
            await insertLedgerEntry(tx, {
              productId: res.productId,
              branchId: res.branchId,
              txnType: "UNRESERVE_IN",
              refType: "SYSTEM",
              refId: draft.id,
              qtyIn: res.qtyOut ?? 1,
              netWeightIn: res.netWeightOut,
              grossWeightIn: res.grossWeightOut,
              remarks: "Auto-cancel expired draft",
            });
          }

          // Delete the draft
          await tx.draftInvoice.delete({ where: { id: draft.id } });
        }
      });
    }

    // 2. Fetch active drafts
    const activeDrafts = await prisma.draftInvoice.findMany({
      where: {
        branchId: Number(branchId),
        expiresAt: { gt: now }, // Extra safety
      },
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ drafts: activeDrafts });
  } catch (error: any) {
    console.error("Error fetching drafts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
