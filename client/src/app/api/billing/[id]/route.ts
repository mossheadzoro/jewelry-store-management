import { NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";
import { insertLedgerEntry } from "../../../../../libs/inventoryLedger";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const invoiceId = parseInt(resolvedParams.id);

    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: "Invalid invoice ID." }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              include: {
                subCategory: true,
              },
            },
          },
        },
        payments: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    // Find applied advance, if any
    const appliedAdvance = await prisma.advance.findFirst({
      where: { appliedInvoiceId: invoiceId },
    });

    // Determine tax settings from the saved invoice values
    const taxOnTotal = invoice.taxOnGold === 0 && invoice.taxOnMaking === 0 && invoice.cgst > 0;
    const taxOnMetal = invoice.taxOnGold > 0;
    const taxOnMaking = invoice.taxOnMaking > 0;
    const hallmarkCharge = invoice.hallmarkingCharge > 0;

    // Format products list to match useBillingLogic hook expected items
    const products = invoice.items.map((item) => {
      const metalValue = item.metalValue;
      const makingValue = item.makingAmount;
      const discountedMaking = makingValue - (makingValue * item.discountOnMaking) / 100;
      const totalBeforeTax = metalValue + discountedMaking;
      const additionalCharge = parseFloat((item.totalAfterTax - totalBeforeTax).toFixed(2));

      return {
        id: item.productId,
        name: item.product.name,
        barcode: item.product.barcode,
        productCode: item.product.productCode,
        gsWeight: item.gsWeight,
        ntWeight: item.ntWeight,
        purity: item.product.purity,
        image: item.product.image,
        subCategory: item.product.subCategory,
        makingChargePercent: item.makingPercent,
        discountOnMaking: item.discountOnMaking,
        additionalCharge: additionalCharge > 0 ? additionalCharge : 0,
        metalRate: item.metalRate,
      };
    });

    // Reconstruct exchangeGoldWeight and exchangeGoldValue
    const totalGoldWeight = invoice.items.reduce((sum, item) => sum + item.ntWeight, 0);
    const metalRate = invoice.items.length > 0 ? invoice.items[0].metalRate : 0;
    let exchangeGoldWeight = 0;

    // Check if we have the custom Old Gold Exchange Weight payment record first
    const oldGoldPaymentRecord = invoice.payments.find((p) =>
      p.paymentRef?.includes("Old Gold Exchange Weight:")
    );
    if (oldGoldPaymentRecord) {
      const match = oldGoldPaymentRecord.paymentRef?.match(/Old Gold Exchange Weight:\s*([\d.]+)/);
      if (match) {
        exchangeGoldWeight = parseFloat(match[1]);
      }
    } else {
      // Fallback to mathematical reconstruction for legacy invoices
      if (invoice.totalMetalAmount > 0 && metalRate > 0) {
        // Normal metal exchange (not excess gold)
        exchangeGoldWeight = totalGoldWeight - invoice.totalMetalAmount / metalRate;
      } else if (invoice.excessGoldMode) {
        // Excess gold scenario where netGoldValue is 0, so totalMetalAmount is 0
        if (invoice.excessGoldMode === "CASH_OUT") {
          const cashOutPayment = invoice.payments.find((p) =>
            p.paymentRef?.includes("OLD Gold Cashed Out")
          );
          if (cashOutPayment) {
            const match = cashOutPayment.paymentRef?.match(/Excess:\s*([\d.]+)/);
            const excessWeight = match ? parseFloat(match[1]) : 0;
            exchangeGoldWeight = totalGoldWeight + excessWeight;
          }
        } else if (invoice.excessGoldMode === "RETURN_GOLD") {
          const returnPayment = invoice.payments.find((p) =>
            p.paymentRef?.includes("Excess Gold Returned to Customer")
          );
          if (returnPayment) {
            const match = returnPayment.paymentRef?.match(/Excess Gold Returned to Customer:\s*([\d.]+)/);
            const excessWeight = match ? parseFloat(match[1]) : 0;
            exchangeGoldWeight = totalGoldWeight + excessWeight;
          }
        }
      }
    }

    // Format payments list to match useBillingLogic hook structure
    // Exclude the internal system payment entries for old gold cashouts/returns/exchange
    const regularPayments = invoice.payments
      .filter(
        (p) =>
          !p.paymentRef?.includes("OLD Gold Cashed Out") &&
          !p.paymentRef?.includes("Cash Given to Customer (Old Gold Excess Settlement)") &&
          !p.paymentRef?.includes("Excess Gold Returned to Customer") &&
          !p.paymentRef?.includes("Old Gold Exchange Weight:")
      )
      .map((p) => {
        let metalWeight = "";
        if (p.method === "METAL" && metalRate > 0) {
          metalWeight = (p.amount / metalRate).toString();
        }
        return {
          method: p.method,
          amount: p.amount.toString(),
          metalWeight,
          narration: p.paymentRef || "",
        };
      });

    // If payments list is empty, default to standard empty payment
    const formattedPayments =
      regularPayments.length > 0
        ? regularPayments
        : [{ method: "CASH", amount: "", metalWeight: "", narration: "" }];

    return NextResponse.json({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customer: invoice.customer,
      branchId: invoice.branchId,
      products,
      payments: formattedPayments,
      metalRate,
      taxOnTotal,
      taxOnMetal,
      taxOnMaking,
      hallmarkCharge,
      exchangeGoldWeight: parseFloat(exchangeGoldWeight.toFixed(3)),
      appliedAdvance,
      excessGoldMode: invoice.excessGoldMode,
      cashOutReductionPercent: invoice.cashOutReductionPct || 10,
    });
  } catch (error: any) {
    console.error("Failed to fetch Invoice for edit:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch invoice" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const invoiceId = parseInt(resolvedParams.id);

    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: "Invalid invoice ID." }, { status: 400 });
    }

    const data = await req.json();
    const { customerId, branchId, billingData } = data;

    if (!customerId || !branchId) {
      return NextResponse.json({ error: "Missing customer or branch info." }, { status: 400 });
    }

    if (!billingData || !billingData.products || billingData.products.length === 0) {
      return NextResponse.json({ error: "Cannot save an empty invoice." }, { status: 400 });
    }

    const {
      products,
      payments,
      metalRate,
      netGoldValue,
      totalMaking,
      taxOnGold,
      taxOnMaking,
      taxOnHallmarking,
      hallmarkingCharge,
      cgst,
      sgst,
      totalAmount,
      appliedAdvanceId,
      // Excess old gold data
      excessGoldMode,
      cashOutReductionPercent,
      cashSettlementRate,
      oldGoldCashedOutValue,
      cashToCustomer,
      excessGoldReturnedWeight,
      exchangeGoldWeight,
      exchangeGoldValue,
    } = billingData;

    // Calculate totals
    const totalPaid = payments.reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);
    const balanceAmount = totalAmount - totalPaid;
    const isFullyPaid = balanceAmount <= 0;

    // Find primary payment method
    let primaryMethod = "OTHER";
    if (payments.length > 0 && payments[0].method) {
      primaryMethod = payments[0].method.toUpperCase();
    }

    const updatedInvoice = await prisma.$transaction(async (tx: any) => {
      // 1. Retrieve the existing invoice items to restore stock
      const oldInvoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { items: true },
      });

      if (!oldInvoice) {
        throw new Error("Invoice not found in transaction.");
      }

      // 2. Revert previous stock changes
      for (const oldItem of oldInvoice.items) {
        await tx.productItem.update({
          where: { id: oldItem.productId },
          data: {
            quantity: { increment: oldItem.quantity || 1 },
            reservedQty: { increment: oldItem.quantity || 1 },
          },
        });
      }

      // 3. Clear old items, payments, and ledger entries for this invoice
      await tx.invoiceItem.deleteMany({ where: { invoiceId } });
      await tx.invoicePayment.deleteMany({ where: { invoiceId } });
      await tx.inventoryLedger.deleteMany({
        where: { refType: "INVOICE", refId: invoiceId.toString() },
      });

      // 4. Revert previous applied advances
      await tx.advance.updateMany({
        where: { appliedInvoiceId: invoiceId },
        data: {
          isApplied: false,
          appliedInvoiceId: null,
        },
      });

      // 5. Create new items, deduct stock, and create ledger entries
      for (const p of products) {
        const metalValue = p.ntWeight * metalRate;
        const makingValue = (metalValue * (p.makingChargePercent ?? 0)) / 100;
        const discountedMaking = makingValue - (makingValue * (p.discountOnMaking ?? 0)) / 100;
        const itemTotal = metalValue + discountedMaking + (p.additionalCharge ?? 0);

        await tx.invoiceItem.create({
          data: {
            invoiceId,
            productId: p.id,
            quantity: p.quantity || 1,
            gsWeight: p.gsWeight,
            ntWeight: p.ntWeight,
            metalRate,
            metalValue,
            makingPercent: p.makingChargePercent || 0,
            makingAmount: makingValue,
            stoneCharge: 0,
            discountOnMaking: p.discountOnMaking || 0,
            totalBeforeTax: metalValue + discountedMaking,
            cgst: 0,
            sgst: 0,
            totalAfterTax: itemTotal,
          },
        });

        // Deduct Stock
        await tx.productItem.update({
          where: { id: p.id },
          data: {
            quantity: { decrement: p.quantity || 1 },
            reservedQty: { decrement: p.quantity || 1 },
          },
        });

        // Auto Ledger entry
        await insertLedgerEntry(tx, {
          productId: p.id,
          branchId,
          txnType: "SALE_OUT",
          refType: "INVOICE",
          refId: invoiceId.toString(),
          qtyOut: p.quantity || 1,
          grossWeightOut: p.gsWeight,
          netWeightOut: p.ntWeight,
          unitCost: metalRate,
          totalValue: itemTotal,
          remarks: `Sale (Updated) - Invoice ${oldInvoice.invoiceNumber}`,
        });
      }

      // 6. Create new payment records
      for (const pay of payments) {
        if (!pay.amount || Number(pay.amount) <= 0) continue;
        await tx.invoicePayment.create({
          data: {
            invoiceId,
            method: pay.method.toUpperCase(),
            amount: Number(pay.amount),
            paymentRef: pay.narration || "",
          },
        });
      }

      // 7. Excess old gold handling
      if (excessGoldMode === "CASH_OUT" && oldGoldCashedOutValue > 0) {
        await tx.invoicePayment.create({
          data: {
            invoiceId,
            method: "OTHER",
            amount: oldGoldCashedOutValue,
            paymentRef: `OLD Gold Cashed Out | Settlement Rate: ₹${cashSettlementRate?.toFixed(2)}/g (-${cashOutReductionPercent}%) | Excess: ${excessGoldReturnedWeight?.toFixed(3)}g`,
          },
        });

        if (cashToCustomer > 0) {
          await tx.invoicePayment.create({
            data: {
              invoiceId,
              method: "CASH",
              amount: -cashToCustomer,
              paymentRef: `Cash Given to Customer (Old Gold Excess Settlement)`,
            },
          });
        }
      }

      if (excessGoldMode === "RETURN_GOLD" && excessGoldReturnedWeight > 0) {
        await tx.invoicePayment.create({
          data: {
            invoiceId,
            method: "OTHER",
            amount: 0,
            paymentRef: `Excess Gold Returned to Customer: ${excessGoldReturnedWeight?.toFixed(3)}g | Old Gold Given: ${exchangeGoldWeight?.toFixed(3)}g | Retained: ${(exchangeGoldWeight - excessGoldReturnedWeight)?.toFixed(3)}g`,
          },
        });
      }

      // 7b. Record Old Gold Exchange Weight for easy retrieval/updation later
      if (exchangeGoldWeight > 0) {
        await tx.invoicePayment.create({
          data: {
            invoiceId,
            method: "OTHER",
            amount: 0,
            paymentRef: `Old Gold Exchange Weight: ${exchangeGoldWeight?.toFixed(3)}g | Value: ₹${exchangeGoldValue?.toFixed(2)}`,
          },
        });
      }

      // 8. Re-apply Advance if selected
      if (appliedAdvanceId) {
        await tx.advance.update({
          where: { id: appliedAdvanceId },
          data: {
            isApplied: true,
            appliedInvoiceId: invoiceId,
          },
        });
      }

      // 9. Update the Invoice container with the new calculations
      const updated = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          customerId,
          branchId,
          totalMetalAmount: netGoldValue,
          totalMakingAmount: totalMaking,
          taxOnGold,
          taxOnMaking,
          taxOnHallmarking,
          hallmarkingCharge,
          cgst,
          sgst,
          totalAmount,
          paymentMethod: primaryMethod,
          paidAmount: totalPaid,
          balanceAmount: Math.max(0, balanceAmount),
          isFullyPaid,
          excessGoldMode,
          cashSettlementRate,
          cashOutReductionPct: cashOutReductionPercent,
          oldGoldCashedOut: oldGoldCashedOutValue,
          cashToCustomer,
          excessGoldReturned: excessGoldReturnedWeight,
        },
      });

      return updated;
    });

    return NextResponse.json({ success: true, invoiceId: updatedInvoice.id });
  } catch (error: any) {
    console.error("Failed to update Invoice:", error);
    return NextResponse.json({ error: error.message || "Failed to update invoice" }, { status: 500 });
  }
}
