import { NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";
import { insertLedgerEntry } from "../../../../../libs/inventoryLedger";
import { evaluateCustomerTags } from "@/lib/services/TagRuleEngine";

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
      exchangeGoldPurity,
      exchangeGoldDeductionPercent,
      exchangeMetalRate,
      exchangeGoldValue,
      appliedSchemes,
      refundMethod,
      refundDetails,
      appliedWalletMetal22K = 0,
      appliedWalletMetal24K = 0,
      appliedAdvanceId,
      customInvoiceNumber,
      customCreatedAt,
    } = billingData;

    // Calculate totals using rounded totalAmount for consistency with UI
    const roundedTotalAmount = Math.round(totalAmount);
    const totalPaid = payments.reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);
    const balanceAmount = roundedTotalAmount - totalPaid;
    const isFullyPaid = balanceAmount <= 0;

    // Calculate additional charges sum across products
    const computedAdditionalAmount = products.reduce((acc: number, p: any) => {
      return acc + Number(p.additionalCharge || p.otherChargesPrice || p.stoneCharge || 0);
    }, 0);
    const totalStoneAmount = billingData.totalStoneAmount ?? computedAdditionalAmount;

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
        const parts = lastInvoice.invoiceNumber.split('-');
        if (parts.length >= 3) {
          const lastSeqStr = parts[parts.length - 1];
          const lastSeq = parseInt(lastSeqStr, 10);
          if (!isNaN(lastSeq)) {
            nextSeq = lastSeq + 1;
          }
        }
      }
      
      const sequenceNumberStr = nextSeq.toString().padStart(4, '0');
      const branchPrefix = branch.name.substring(0, 3).toUpperCase();
      const generatedInvoiceNumber = `INV-${branchPrefix}-${fyString}-${sequenceNumberStr}`;
      
      const invoiceNumber = customInvoiceNumber || generatedInvoiceNumber;
      
      // 1. Create Invoice Container
      const newInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          createdAt: customCreatedAt ? new Date(customCreatedAt) : undefined,
          updatedAt: customCreatedAt ? new Date(customCreatedAt) : undefined,
          customerId,
          branchId,
          totalMetalAmount: netGoldValue,
          totalMakingAmount: totalMaking,
          totalStoneAmount: totalStoneAmount,
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
          excessGoldMode,
          cashOutReductionPct: cashOutReductionPercent,
          cashSettlementRate,
          oldGoldCashedOut: oldGoldCashedOutValue,
          cashToCustomer,
          refundMethod,
          refundDetails,
          excessGoldReturned: excessGoldReturnedWeight,
        }
      });

      // 2. Create Items & Deduct Stock
      const billedOrderIds = new Set<string>();

      for (const p of products) {
        if (p.orderId) {
          billedOrderIds.add(p.orderId);
        }
        
        const metalValue = p.ntWeight * metalRate;
        const makingValue = (metalValue * (p.makingChargePercent ?? 0)) / 100;
        const discountedMaking = makingValue - (makingValue * (p.discountOnMaking ?? 0)) / 100;
        const additionalCharge = Number(p.additionalCharge ?? p.otherChargesPrice ?? p.stoneCharge ?? 0);
        const lineTaxableTotal = metalValue + discountedMaking + additionalCharge;

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
            invoiceId: newInvoice.id,
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
            totalBeforeTax: lineTaxableTotal,
            cgst: 0, // currently kept simple at invoice level
            sgst: 0,
            totalAfterTax: lineTaxableTotal,
          }
        });

        // 📒 Auto Ledger: SALE_OUT (Must be BEFORE Deduct Stock)
        await insertLedgerEntry(tx, {
          productId: finalProductId,
          branchId,
          txnType: "SALE_OUT",
          refType: "INVOICE",
          refId: newInvoice.id.toString(),
          qtyOut: p.quantity || 1,
          notes: `Sold via Invoice ${invoiceNumber}`,
        });

        // Deduct Stock
        await tx.productItem.update({
          where: { id: finalProductId },
          data: {
            quantity: {
              decrement: p.quantity || 1,
            },
          },
        });
      }

      // 3. Create Payment Records
      for (const pay of payments) {
        if (Number(pay.amount) > 0) {
          await tx.invoicePayment.create({
            data: {
              invoiceId: newInvoice.id,
              amount: Number(pay.amount),
              method: pay.method.toUpperCase(),
              paymentRef: pay.notes || pay.narration || null,
            }
          });
        }
      }

      // 3b. Excess old gold handling
      if (excessGoldMode === "CASH_OUT" && oldGoldCashedOutValue > 0) {
        await tx.invoicePayment.create({
          data: {
            invoiceId: newInvoice.id,
            method: "OTHER",
            amount: oldGoldCashedOutValue,
            paymentRef: `OLD Gold Cashed Out | Settlement Rate: ₹${cashSettlementRate?.toFixed(2)}/g (-${cashOutReductionPercent}%) | Excess: ${excessGoldReturnedWeight?.toFixed(3)}g`,
          },
        });

        if (cashToCustomer > 0) {
          await tx.invoicePayment.create({
            data: {
              invoiceId: newInvoice.id,
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
            invoiceId: newInvoice.id,
            method: "OTHER",
            amount: 0,
            paymentRef: `Excess Gold Returned to Customer: ${excessGoldReturnedWeight?.toFixed(3)}g | Old Gold Given: ${exchangeGoldWeight?.toFixed(3)}g | Retained: ${(exchangeGoldWeight - excessGoldReturnedWeight)?.toFixed(3)}g`,
          },
        });
      }

      // 3c. Record Old Gold Exchange Weight for easy retrieval/updation later
      if (exchangeGoldWeight > 0) {
        await tx.invoicePayment.create({
          data: {
            invoiceId: newInvoice.id,
            method: "OTHER",
            amount: 0,
            paymentRef: `Old Gold Exchange Weight: ${exchangeGoldWeight?.toFixed(3)}g | Purity: ${exchangeGoldPurity || '22k'} | Deduction: ${exchangeGoldDeductionPercent || 2}% | Rate: ₹${exchangeMetalRate?.toFixed(2)} | Value: ₹${exchangeGoldValue?.toFixed(2)}`,
          },
        });
      }

      // 4. Update Customer Total Purchases & Spent (Removed as fields do not exist in schema)

      // 4a. Deduct Applied Wallet Metal
      if (appliedWalletMetal22K > 0 || appliedWalletMetal24K > 0) {
        const wallet = await tx.customerWallet.findUnique({
          where: { customerId: customerId }
        });
        if (wallet) {
          const deduction22K = Math.min(appliedWalletMetal22K, wallet.metal22KBalance);
          const deduction24K = Math.min(appliedWalletMetal24K, wallet.metal24KBalance);
          
          if (deduction22K > 0 || deduction24K > 0) {
            await tx.customerWallet.update({
              where: { id: wallet.id },
              data: {
                metal22KBalance: { decrement: deduction22K },
                metal24KBalance: { decrement: deduction24K },
                updatedAt: new Date()
              }
            });

            if (deduction22K > 0) {
              await tx.customerWalletLedger.create({
                data: {
                  id: `LED-${Date.now()}-${Math.floor(Math.random()*1000)}-22k`,
                  walletId: wallet.id,
                  transactionType: 'DEBIT',
                  assetType: 'METAL_22K',
                  amount: deduction22K,
                  description: `Used metal for Invoice ${invoiceNumber}`,
                  relatedEntityId: newInvoice.id.toString(),
                }
              });
            }
            if (deduction24K > 0) {
              await tx.customerWalletLedger.create({
                data: {
                  id: `LED-${Date.now()}-${Math.floor(Math.random()*1000)}-24k`,
                  walletId: wallet.id,
                  transactionType: 'DEBIT',
                  assetType: 'METAL_24K',
                  amount: deduction24K,
                  description: `Used metal for Invoice ${invoiceNumber}`,
                  relatedEntityId: newInvoice.id.toString(),
                }
              });
            }
          }
        }
      }

      // Wallet Funding (Excess Gold returned as Cash/Metal in Wallet)
      if (cashToCustomer > 0) {
        if (refundMethod === 'WALLET_CASH' || refundMethod === 'WALLET_METAL') {
          // Find or create customer wallet
          let wallet = await tx.customerWallet.findUnique({
            where: { customerId: customerId }
          });
          
          if (!wallet) {
            wallet = await tx.customerWallet.create({
              data: {
                id: `WAL-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                customerId: customerId,
                cashBalance: 0,
                metal22KBalance: 0,
                metal24KBalance: 0,
                updatedAt: new Date(),
              }
            });
          }

          if (refundMethod === 'WALLET_CASH') {
            await tx.customerWallet.update({
              where: { id: wallet.id },
              data: { 
                cashBalance: { increment: cashToCustomer },
                updatedAt: new Date()
              }
            });
            await tx.customerWalletLedger.create({
              data: {
                id: `LED-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                walletId: wallet.id,
                transactionType: 'CREDIT',
                assetType: 'CASH',
                amount: cashToCustomer,
                description: `Refund from Invoice ${invoiceNumber}`,
                relatedEntityId: newInvoice.id.toString(),
              }
            });
          } else if (refundMethod === 'WALLET_METAL' && cashSettlementRate > 0) {
            const metalEquivalent = cashToCustomer / cashSettlementRate;
            await tx.customerWallet.update({
              where: { id: wallet.id },
              data: {
                metal22KBalance: { increment: metalEquivalent },
                updatedAt: new Date()
              }
            });
            await tx.customerWalletLedger.create({
              data: {
                id: `LED-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                walletId: wallet.id,
                transactionType: 'CREDIT',
                assetType: 'METAL_22K',
                amount: metalEquivalent,
                goldRateApplied: cashSettlementRate,
                description: `Refund converted to Metal from Invoice ${invoiceNumber}`,
                relatedEntityId: newInvoice.id.toString(),
              }
            });
          }
        }
      }

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

      // 🏷️ Auto-evaluate customer tags based on updated stats
      await evaluateCustomerTags(customerId);

      return newInvoice;
    });

    return NextResponse.json({
      message: "Invoice created successfully!",
      invoice,
    });

  } catch (err: any) {
    console.error("Error creating invoice:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
