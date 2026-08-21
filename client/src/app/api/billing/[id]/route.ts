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

    // Fetch scheme redemptions separately since the relation might not be defined on Invoice model
    const schemeRedemptions = await prisma.schemeRedemption.findMany({
      where: { invoiceId },
      include: { scheme: true },
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
      const additionalCharge = item.stoneCharge ?? 0;
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
        quantity: item.quantity || 1,
        makingChargePercent: item.makingPercent,
        makingAmount: item.makingAmount,
        discountOnMaking: item.discountOnMaking,
        stoneCharge: item.stoneCharge,
        additionalCharge: additionalCharge > 0 ? additionalCharge : 0,
        metalRate: item.metalRate,
        metalValue: item.metalValue,
        totalBeforeTax: item.totalBeforeTax,
        cgst: item.cgst,
        sgst: item.sgst,
        totalAfterTax: item.totalAfterTax,
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
    let exchangeGoldPurity: string | undefined = undefined;
    let exchangeGoldDeductionPercent: number | undefined = undefined;
    let exchangeMetalRate: number | undefined = undefined;

    if (oldGoldPaymentRecord) {
      const match = oldGoldPaymentRecord.paymentRef?.match(/Old Gold Exchange Weight:\s*([\d.]+)/);
      if (match) {
        exchangeGoldWeight = parseFloat(match[1]);
      }
      const purityMatch = oldGoldPaymentRecord.paymentRef?.match(/Purity:\s*([^\s|]+)/);
      if (purityMatch) exchangeGoldPurity = purityMatch[1];
      
      const deductionMatch = oldGoldPaymentRecord.paymentRef?.match(/Deduction:\s*([\d.]+)/);
      if (deductionMatch) exchangeGoldDeductionPercent = parseFloat(deductionMatch[1]);

      const rateMatch = oldGoldPaymentRecord.paymentRef?.match(/Rate:\s*₹([\d.]+)/);
      if (rateMatch) exchangeMetalRate = parseFloat(rateMatch[1]);
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
          let excessWeight = 0;
          if (cashOutPayment) {
            const match = cashOutPayment.paymentRef?.match(/Excess:\s*([\d.]+)/);
            excessWeight = match ? parseFloat(match[1]) : 0;
          } else if (invoice.oldGoldCashedOut && invoice.oldGoldCashedOut > 0) {
            // Recovery for old invoices missing payment records
            const reduction = invoice.cashOutReductionPct || 10;
            excessWeight = invoice.oldGoldCashedOut / (metalRate * (1 - reduction/100));
          }
          exchangeGoldWeight = totalGoldWeight + excessWeight;
        } else if (invoice.excessGoldMode === "RETURN_GOLD") {
          const returnPayment = invoice.payments.find((p) =>
            p.paymentRef?.includes("Excess Gold Returned to Customer")
          );
          let excessWeight = 0;
          if (returnPayment) {
            const match = returnPayment.paymentRef?.match(/Excess Gold Returned to Customer:\s*([\d.]+)/);
            excessWeight = match ? parseFloat(match[1]) : 0;
          } else if (invoice.excessGoldReturned && invoice.excessGoldReturned > 0) {
            // Recovery for old invoices
            excessWeight = invoice.excessGoldReturned;
          }
          exchangeGoldWeight = totalGoldWeight + excessWeight;
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
        
        const isScheme = p.method === "SCHEME";
        // Attempt to find the matching redemption to get the schemeId
        let schemeId = undefined;
        if (isScheme) {
            const redemption = schemeRedemptions.find(r => p.paymentRef?.includes(r.scheme.schemeNumber));
            if (redemption) schemeId = redemption.schemeId;
        }

        return {
          method: p.method,
          amount: p.amount.toString(),
          metalWeight,
          narration: p.paymentRef || "",
          isLocked: isScheme,
          ...(schemeId ? { schemeId } : {})
        };
      });

    // If payments list is empty, default to standard empty payment
    const formattedPayments =
      regularPayments.length > 0
        ? regularPayments
        : [{ method: "CASH", amount: "", metalWeight: "", narration: "" }];

    // Map scheme redemptions to appliedSchemes
    const appliedSchemes = schemeRedemptions.map((r) => ({
      ...r.scheme,
      amountUsed: r.amountUsed,
      goldWeightUsed: r.goldWeightUsed,
      redemptionType: 'STANDARD', // Or try to infer from amount
    }));

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
      hallmarkingCharge: invoice.hallmarkingCharge || 0,
      totalMetalAmount: invoice.totalMetalAmount || 0,
      totalMakingAmount: invoice.totalMakingAmount || 0,
      totalStoneAmount: invoice.totalStoneAmount || 0,
      discountOnMaking: invoice.discountOnMaking || 0,
      overallDiscount: invoice.overallDiscount || 0,
      taxOnGold: invoice.taxOnGold || 0,
      taxOnMakingAmount: invoice.taxOnMaking || 0,
      taxOnHallmarking: invoice.taxOnHallmarking || 0,
      cgst: invoice.cgst || 0,
      sgst: invoice.sgst || 0,
      grandTotal: invoice.totalAmount || 0,
      totalAmount: invoice.totalAmount || 0,
      paidAmount: invoice.paidAmount || 0,
      balanceAmount: invoice.balanceAmount || 0,
      createdAt: invoice.createdAt,
      exchangeGoldWeight: parseFloat(exchangeGoldWeight.toFixed(3)),
      exchangeGoldPurity,
      exchangeGoldDeductionPercent,
      exchangeMetalRate,
      appliedAdvance,
      appliedSchemes,
      excessGoldMode: invoice.excessGoldMode,
      cashSettlementRate: invoice.cashSettlementRate,
      oldGoldCashedOut: invoice.oldGoldCashedOut,
      cashToCustomer: invoice.cashToCustomer,
      excessGoldReturned: invoice.excessGoldReturned,
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
      totalStoneAmount,
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
      exchangeGoldPurity,
      exchangeGoldDeductionPercent,
      exchangeMetalRate,
      exchangeGoldValue,
      appliedSchemes,
      customInvoiceNumber,
      customCreatedAt,
    } = billingData;

    // Calculate totals using rounded totalAmount for consistency with UI
    const roundedTotalAmount = Math.round(totalAmount);
    const totalPaid = payments.reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);
    const balanceAmount = roundedTotalAmount - totalPaid;
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

      // 4b. Revert Scheme Redemptions
      const oldRedemptions = await tx.schemeRedemption.findMany({
        where: { invoiceId },
      });
      for (const red of oldRedemptions) {
        const dbScheme = await tx.savingScheme.findUnique({
          where: { id: red.schemeId }
        });
        if (dbScheme) {
          const newTotalRedeemed = Math.max(0, dbScheme.totalRedeemed - red.amountUsed);
          let newStatus = dbScheme.status;
          
          if (newTotalRedeemed === 0) {
            newStatus = "ACTIVE";
          } else {
            newStatus = "PARTIALLY_REDEEMED";
          }

          let newInvoiceIds = dbScheme.redeemedInvoiceIds || "";
          if (newInvoiceIds) {
             newInvoiceIds = newInvoiceIds.split(",").filter((id: string) => id !== String(invoiceId)).join(",");
          }
          await tx.savingScheme.update({
            where: { id: dbScheme.id },
            data: {
              totalRedeemed: newTotalRedeemed,
              status: newStatus,
              redeemedInvoiceIds: newInvoiceIds,
            }
          });
        }
      }
      await tx.schemeRedemption.deleteMany({ where: { invoiceId } });

      // 5. Create new items, deduct stock, and create ledger entries
      const billedOrderIds = new Set<string>();
      
      for (const p of products) {
        if (p.orderId) {
          billedOrderIds.add(p.orderId);
        }
        const metalValue = p.ntWeight * metalRate;
        const makingValue = (metalValue * (p.makingChargePercent ?? 0)) / 100;
        const discountedMaking = makingValue - (makingValue * (p.discountOnMaking ?? 0)) / 100;
        const additionalCharge = Number(p.additionalCharge ?? p.otherChargesPrice ?? p.stoneCharge ?? 0);
        const itemTotal = metalValue + discountedMaking + additionalCharge;

        let finalProductId = p.id || p.productId;

        if (!finalProductId && p.orderId) {
          const subCategory = await tx.subCategory.findFirst({
            where: { branchId },
          });
          if (!subCategory) {
            throw new Error("No SubCategory found in this branch to assign the custom order product.");
          }
          const newProduct = await tx.productItem.create({
            data: {
              name: p.name || "Custom Order Item",
              barcode: p.barcode || `ORD-${Date.now()}-${Math.floor(Math.random()*1000)}`,
              productCode: p.productCode || `ORD-${Date.now()}-${Math.floor(Math.random()*1000)}`,
              gsWeight: p.gsWeight || 0,
              ntWeight: p.ntWeight || 0,
              purity: p.purity || 22,
              quantity: p.quantity || 1,
              branchId,
              subCategoryId: subCategory.id,
            }
          });
          finalProductId = newProduct.id;
        } else if (!finalProductId) {
          throw new Error("Product ID is missing for an item.");
        }

        await tx.invoiceItem.create({
          data: {
            invoiceId,
            productId: finalProductId,
            quantity: p.quantity || 1,
            gsWeight: p.gsWeight,
            ntWeight: p.ntWeight,
            metalRate,
            metalValue,
            makingPercent: p.makingChargePercent || 0,
            makingAmount: makingValue,
            stoneCharge: additionalCharge,
            discountOnMaking: p.discountOnMaking || 0,
            totalBeforeTax: metalValue + discountedMaking + additionalCharge,
            cgst: 0,
            sgst: 0,
            totalAfterTax: itemTotal,
          },
        });

        // Auto Ledger entry (Must be BEFORE Deduct Stock)
        await insertLedgerEntry(tx, {
          productId: finalProductId,
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

        // Deduct Stock
        await tx.productItem.update({
          where: { id: finalProductId },
          data: {
            quantity: { decrement: p.quantity || 1 },
            reservedQty: { decrement: p.quantity || 1 },
          },
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
            paymentRef: `Old Gold Exchange Weight: ${exchangeGoldWeight?.toFixed(3)}g | Purity: ${exchangeGoldPurity || '22k'} | Deduction: ${exchangeGoldDeductionPercent || 2}% | Rate: ₹${exchangeMetalRate?.toFixed(2)} | Value: ₹${exchangeGoldValue?.toFixed(2)}`,
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

      // 8b. Re-apply Saving Schemes
      if (appliedSchemes && appliedSchemes.length > 0) {
        for (const scheme of appliedSchemes) {
          if (!scheme.amountUsed || scheme.amountUsed <= 0) continue;

          await tx.schemeRedemption.create({
            data: {
              schemeId: scheme.id,
              invoiceId: invoiceId,
              amountUsed: scheme.amountUsed,
              goldWeightUsed: scheme.goldWeightUsed,
              remarks: `Redeemed ₹${scheme.amountUsed} against invoice ${oldInvoice.invoiceNumber}`,
            }
          });

          const dbScheme = await tx.savingScheme.findUnique({
            where: { id: scheme.id },
            select: { totalCashDeposited: true, totalBonusAmount: true, totalRedeemed: true, redeemedInvoiceIds: true, status: true }
          });

          if (dbScheme) {
            const newTotalRedeemed = dbScheme.totalRedeemed + scheme.amountUsed;
            const availableBalance = (dbScheme.totalCashDeposited + dbScheme.totalBonusAmount) - dbScheme.totalRedeemed;
            const remainingBalance = availableBalance - scheme.amountUsed;

            let newStatus = dbScheme.status;
            if (remainingBalance <= 0) {
              newStatus = "REDEEMED";
            } else if (newTotalRedeemed > 0) {
              newStatus = "PARTIALLY_REDEEMED";
            }

            const existingInvoiceIds = dbScheme.redeemedInvoiceIds || "";
            const newInvoiceIds = existingInvoiceIds
                ? `${existingInvoiceIds},${invoiceId}`
                : String(invoiceId);

            await tx.savingScheme.update({
              where: { id: scheme.id },
              data: {
                totalRedeemed: newTotalRedeemed,
                redeemedInvoiceIds: newInvoiceIds,
                status: newStatus,
              }
            });
          }
        }
      }

      // 9. Update the Invoice container with the new calculations
      // Mark associated Orders as DELIVERED if fully paid
      if (isFullyPaid) {
        if (appliedAdvanceId) {
          const advance = await tx.advance.findUnique({
            where: { id: appliedAdvanceId },
            select: { orderId: true }
          });
          
          if (advance && advance.orderId) {
            billedOrderIds.add(advance.orderId);
          }
        }

        if (billedOrderIds.size > 0) {
          await tx.order.updateMany({
            where: { id: { in: Array.from(billedOrderIds) } },
            data: { status: "DELIVERED" }
          });
        }
      }

      const updated = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          invoiceNumber: customInvoiceNumber || undefined,
          createdAt: customCreatedAt ? new Date(customCreatedAt) : undefined,
          updatedAt: customCreatedAt ? new Date(customCreatedAt) : undefined,
          customerId,
          branchId,
          totalMetalAmount: netGoldValue,
          totalMakingAmount: totalMaking,
          totalStoneAmount: totalStoneAmount ?? 0,
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
