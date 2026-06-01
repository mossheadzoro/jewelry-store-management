import { NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";
import { insertLedgerEntry } from "../../../../../libs/inventoryLedger";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { customerId, branchId, billingData } = data;

    if (!customerId || !branchId) {
      return NextResponse.json({ error: "Missing customer or branch info." }, { status: 400 });
    }

    if (!billingData || !billingData.products || billingData.products.length === 0) {
      return NextResponse.json({ error: "Cannot create an empty invoice." }, { status: 400 });
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
    
    // Fetch Branch to get its code (first 3 letters)
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { name: true }
    });
    
    if (!branch) {
      return NextResponse.json({ error: "Branch not found." }, { status: 400 });
    }
    
    const branchCode = branch.name.substring(0, 3).toUpperCase();
    
    // Calculate Financial Year
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed: 0=Jan, 3=Apr
    
    let fyStartYear, fyEndYear;
    if (month >= 3) { // April to December
      fyStartYear = year;
      fyEndYear = year + 1;
    } else { // January to March
      fyStartYear = year - 1;
      fyEndYear = year;
    }
    const fyString = `${fyStartYear.toString().slice(-2)}-${fyEndYear.toString().slice(-2)}`;
    
    const startOfFY = new Date(fyStartYear, 3, 1); // April 1st
    const endOfFY = new Date(fyEndYear, 2, 31, 23, 59, 59, 999); // March 31st

    // Create Invoice with Transaction
    const invoice = await prisma.$transaction(async (tx: any) => {
      
      // Determine next sequence number
      const lastInvoice = await tx.invoice.findFirst({
        where: {
          branchId,
          createdAt: {
            gte: startOfFY,
            lte: endOfFY,
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: { invoiceNumber: true }
      });

      let nextSeq = 1;
      if (lastInvoice && lastInvoice.invoiceNumber) {
        // Expected format: INV-KOL/25-26/000145
        const parts = lastInvoice.invoiceNumber.split('/');
        if (parts.length === 3) {
          const lastSeq = parseInt(parts[2], 10);
          if (!isNaN(lastSeq)) {
            nextSeq = lastSeq + 1;
          }
        }
      }
      
      const sequenceNumber = nextSeq.toString().padStart(6, '0');
      const invoiceNumber = `INV-${branchCode}/${fyString}/${sequenceNumber}`;
      
      // 1. Create Invoice Container
      const newInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          customerId,
          branchId,
          // createdById // if we have auth integrated later
          totalMetalAmount: netGoldValue,
          totalMakingAmount: totalMaking,
          totalStoneAmount: 0,
          discountOnMaking: 0,
          overallDiscount: 0,
          taxOnGold: taxOnGold,
          taxOnMaking: taxOnMaking,
          taxOnHallmarking: taxOnHallmarking,
          hallmarkingCharge: hallmarkingCharge,
          cgst,
          sgst,
          totalAmount,
          paymentMethod: primaryMethod,
          paidAmount: totalPaid,
          balanceAmount: Math.max(0, balanceAmount),
          isFullyPaid,
        }
      });

      // 2. Create Items & Deduct Stock
      for (const p of products) {
        
        const metalValue = p.ntWeight * metalRate;
        const makingValue = (metalValue * (p.makingChargePercent ?? 0)) / 100;
        const discountedMaking = makingValue - (makingValue * (p.discountOnMaking ?? 0)) / 100;
        const itemTotal = metalValue + discountedMaking + (p.additionalCharge ?? 0);

        await tx.invoiceItem.create({
          data: {
            invoiceId: newInvoice.id,
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
            cgst: 0, // currently kept simple at invoice level
            sgst: 0,
            totalAfterTax: itemTotal,
          }
        });

        // Deduct Stock
        await tx.productItem.update({
          where: { id: p.id },
          data: {
            quantity: { decrement: p.quantity || 1 },
            reservedQty: { decrement: p.quantity || 1 }, // Assuming it was reserved
          }
        });

        // 📒 Auto Ledger: SALE_OUT
        await insertLedgerEntry(tx, {
          productId: p.id,
          branchId,
          txnType: "SALE_OUT",
          refType: "INVOICE",
          refId: newInvoice.id.toString(),
          qtyOut: p.quantity || 1,
          grossWeightOut: p.gsWeight,
          netWeightOut: p.ntWeight,
          unitCost: metalRate,
          totalValue: itemTotal,
          remarks: `Sale - Invoice ${invoiceNumber}`,
        });
      }

      // 3. Apply Payments
      for (const pay of payments) {
        if (!pay.amount || Number(pay.amount) <= 0) continue;
        await tx.invoicePayment.create({
           data: {
             invoiceId: newInvoice.id,
             method: pay.method.toUpperCase(),
             amount: Number(pay.amount),
             paymentRef: pay.narration || "",
           }
        });
      }

      // 4. Excess Old Gold — Record Cash Out as payment
      if (excessGoldMode === 'CASH_OUT' && oldGoldCashedOutValue > 0) {
        await tx.invoicePayment.create({
          data: {
            invoiceId: newInvoice.id,
            method: "OTHER",
            amount: oldGoldCashedOutValue,
            paymentRef: `OLD Gold Cashed Out | Settlement Rate: ₹${cashSettlementRate?.toFixed(2)}/g (-${cashOutReductionPercent}%) | Excess: ${excessGoldReturnedWeight?.toFixed(3)}g`,
          }
        });

        // If cash is given back to customer, record as a separate entry
        if (cashToCustomer > 0) {
          await tx.invoicePayment.create({
            data: {
              invoiceId: newInvoice.id,
              method: "CASH",
              amount: -cashToCustomer, // Negative amount = cash given to customer
              paymentRef: `Cash Given to Customer (Old Gold Excess Settlement)`,
            }
          });
        }
      }

      // 5. Excess Old Gold — Record Return Gold info
      if (excessGoldMode === 'RETURN_GOLD' && excessGoldReturnedWeight > 0) {
        await tx.invoicePayment.create({
          data: {
            invoiceId: newInvoice.id,
            method: "OTHER",
            amount: 0,
            paymentRef: `Excess Gold Returned to Customer: ${excessGoldReturnedWeight?.toFixed(3)}g | Old Gold Given: ${exchangeGoldWeight?.toFixed(3)}g | Retained: ${(exchangeGoldWeight - excessGoldReturnedWeight)?.toFixed(3)}g`,
          }
        });
      }

      // 5b. Record Old Gold Exchange Weight for easy retrieval/updation later
      if (exchangeGoldWeight > 0) {
        await tx.invoicePayment.create({
          data: {
            invoiceId: newInvoice.id,
            method: "OTHER",
            amount: 0,
            paymentRef: `Old Gold Exchange Weight: ${exchangeGoldWeight?.toFixed(3)}g | Value: ₹${exchangeGoldValue?.toFixed(2)}`,
          }
        });
      }

      // 6. Mark Advance as applied
      if (billingData.appliedAdvanceId) {
        await tx.advance.update({
          where: { id: billingData.appliedAdvanceId },
          data: {
            isApplied: true,
            appliedInvoiceId: newInvoice.id,
          }
        });
      }

      return newInvoice;
    });

    return NextResponse.json({ success: true, invoiceId: invoice.id });
  } catch (error: any) {
    console.error("Failed to create Invoice:", error);
    return NextResponse.json({ error: error.message || "Failed to create invoice" }, { status: 500 });
  }
}
