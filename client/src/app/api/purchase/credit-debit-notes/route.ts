// client/src/app/api/purchase/credit-debit-notes/route.ts
// Supplier Credit Notes & Debit Notes API

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { PurchaseReturnNoteService } from "@/lib/services/purchase/PurchaseReturnNoteService";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = auth.user.systemRole;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId")
      ? parseInt(searchParams.get("branchId")!, 10)
      : auth.branchId;
    const supplierId = searchParams.get("supplierId") || undefined;
    const type = searchParams.get("type") || "ALL"; // CREDIT, DEBIT, ALL

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (supplierId) where.supplierId = supplierId;

    let creditNotes: any[] = [];
    let debitNotes: any[] = [];

    if (type === "ALL" || type === "CREDIT") {
      creditNotes = await prisma.purchaseCreditNote.findMany({
        where,
        include: {
          supplier: { select: { businessName: true, code: true } },
          invoice: { select: { invoiceNumber: true } },
          purchaseReturn: { select: { returnNumber: true } },
          createdBy: { select: { name: true } },
        },
        orderBy: { issueDate: "desc" },
      });
    }

    if (type === "ALL" || type === "DEBIT") {
      debitNotes = await prisma.purchaseDebitNote.findMany({
        where,
        include: {
          supplier: { select: { businessName: true, code: true } },
          invoice: { select: { invoiceNumber: true } },
          createdBy: { select: { name: true } },
        },
        orderBy: { issueDate: "desc" },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        creditNotes,
        debitNotes,
      },
    });
  } catch (error: any) {
    console.error("Get credit/debit notes error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch credit/debit notes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = auth.user.systemRole;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const branchId = body.branchId ? parseInt(body.branchId, 10) : auth.branchId || 1;
    const createdById = parseInt(auth.session.user.id, 10);
    const { noteType = "CREDIT" } = body; // CREDIT or DEBIT

    if (noteType === "DEBIT") {
      let purchaseInvoiceId = body.purchaseInvoiceId;
      let originalInvoiceNumber = body.originalInvoiceNumber;
      let originalInvoiceDate = body.originalInvoiceDate;

      // If purchaseInvoiceId was not explicitly provided, find the latest invoice for this supplier
      if (!purchaseInvoiceId && body.supplierId) {
        const latestInv = await prisma.purchaseInvoice.findFirst({
          where: { supplierId: body.supplierId, branchId },
          orderBy: { invoiceDate: "desc" },
        });
        if (latestInv) {
          purchaseInvoiceId = latestInv.id;
          if (!originalInvoiceNumber) originalInvoiceNumber = latestInv.invoiceNumber;
          if (!originalInvoiceDate) originalInvoiceDate = latestInv.invoiceDate;
        }
      }

      if (!purchaseInvoiceId) {
        return NextResponse.json(
          { error: "A valid purchase invoice is required to issue a debit note." },
          { status: 400 }
        );
      }

      const debitNote = await PurchaseReturnNoteService.createDebitNote({
        purchaseInvoiceId,
        supplierId: body.supplierId,
        branchId,
        supplierDebitNoteNo: body.supplierDebitNoteNo,
        originalInvoiceNumber: originalInvoiceNumber || "INV-DIRECT",
        originalInvoiceDate: originalInvoiceDate ? new Date(originalInvoiceDate) : new Date(),
        taxableValue: Number(body.taxableValue),
        cgstAmount: body.cgstAmount ? Number(body.cgstAmount) : 0,
        sgstAmount: body.sgstAmount ? Number(body.sgstAmount) : 0,
        igstAmount: body.igstAmount ? Number(body.igstAmount) : 0,
        reason: body.reason,
        createdById,
        reqContext: {
          userId: createdById,
          userEmail: auth.session.user.email,
          role: auth.user.systemRole,
        },
      });
      return NextResponse.json({ success: true, data: debitNote }, { status: 201 });
    } else {
      // Direct Credit Note creation (without prior return)
      const creditNote = await prisma.$transaction(async (tx) => {
        const creditNoteNumber = await (await import("@/lib/services/purchase/PurchaseNumberingService")).PurchaseNumberingService.generateNumber("CREDIT_NOTE", branchId);
        const taxableValue = Number(body.taxableValue);
        const cgst = body.cgstAmount ? Number(body.cgstAmount) : 0;
        const sgst = body.sgstAmount ? Number(body.sgstAmount) : 0;
        const igst = body.igstAmount ? Number(body.igstAmount) : 0;
        const totalAmount = Number((taxableValue + cgst + sgst + igst).toFixed(2));

        const created = await tx.purchaseCreditNote.create({
          data: {
            creditNoteNumber,
            supplierCreditNoteNo: body.supplierCreditNoteNo,
            purchaseInvoiceId: body.purchaseInvoiceId || undefined,
            supplierId: body.supplierId,
            branchId,
            issueDate: new Date(),
            transactionAt: new Date(),
            originalInvoiceNumber: body.originalInvoiceNumber || "DIRECT",
            originalInvoiceDate: body.originalInvoiceDate ? new Date(body.originalInvoiceDate) : new Date(),
            reason: body.reason,
            taxableValue,
            cgstAmount: cgst,
            sgstAmount: sgst,
            igstAmount: igst,
            totalAmount,
            itcReductionAmount: cgst + sgst + igst,
            affectedGrossWeight: body.affectedGrossWeight ? Number(body.affectedGrossWeight) : 0,
            affectedFineWeight: body.affectedFineWeight ? Number(body.affectedFineWeight) : 0,
            settlementMode: body.settlementMode || "DEDUCT_PAYABLE",
            status: "ISSUED",
            createdById,
          },
        });

        // Decrement supplier payable balance
        const supplier = await tx.bullionSupplier.findUnique({ where: { id: body.supplierId } });
        if (supplier) {
          const newPayable = Number((supplier.currentPayable - totalAmount).toFixed(2));
          await tx.bullionSupplier.update({
            where: { id: body.supplierId },
            data: { currentPayable: newPayable },
          });

          await tx.supplierLedgerEntry.create({
            data: {
              supplierId: body.supplierId,
              branchId,
              entryType: "CREDIT_NOTE",
              debit: totalAmount,
              credit: 0,
              balance: newPayable,
              referenceType: "CREDIT_NOTE",
              referenceId: created.id,
              documentNumber: creditNoteNumber,
              description: `Credit Note ${creditNoteNumber} (${body.reason})`,
              transactionDate: new Date(),
              createdById,
            },
          });

          // Create PurchaseGSTRecord for Credit Note (ITC reversal)
          const periodMonth = new Date().getMonth() + 1;
          const periodYear = new Date().getFullYear();
          const financialYear = periodMonth >= 4 ? `${periodYear}-${periodYear + 1}` : `${periodYear - 1}-${periodYear}`;
          const totalTax = Number((cgst + sgst + igst).toFixed(2));

          await tx.purchaseGSTRecord.create({
            data: {
              branchId,
              supplierId: body.supplierId,
              purchaseInvoiceId: body.purchaseInvoiceId || undefined,
              purchaseCreditNoteId: created.id,
              financialYear,
              periodMonth,
              periodYear,
              gstin: supplier.gstin || "UNREGISTERED",
              placeOfSupply: supplier.state ? `${supplier.state} (${supplier.stateCode || "19"})` : "West Bengal (19)",
              isInterState: igst > 0,
              taxableValue: -taxableValue,
              cgst: -cgst,
              sgst: -sgst,
              igst: -igst,
              totalTax: -totalTax,
              itcEligibility: "ELIGIBLE",
              itcClaimedAmount: -totalTax,
              reconciliationStatus: "NOT_RECONCILED",
            },
          });
        }

        return created;
      });

      return NextResponse.json({ success: true, data: creditNote }, { status: 201 });
    }
  } catch (error: any) {
    console.error("Create credit/debit note error:", error);
    return NextResponse.json({ error: error.message || "Failed to create note" }, { status: 500 });
  }
}
