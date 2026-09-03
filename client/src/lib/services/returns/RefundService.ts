// src/lib/services/returns/RefundService.ts
// Refund Processing & Customer Wallet Integration Engine

import { ReturnNumberingService } from "./ReturnNumberingService";

export interface CreateRefundParams {
  transactionId: string;
  transactionNumber: string;
  branchId: number;
  customerId: number;
  amount: number;
  method: "CASH" | "UPI" | "CARD" | "BANK_TRANSFER" | "STORE_CREDIT" | "CUSTOMER_WALLET" | "EXCHANGE_OFFSET";
  paymentReference?: string;
  requestedById?: number;
  approvedById?: number;
  processedById?: number;
  notes?: string;
  customDate?: Date;
}

export class RefundService {
  /**
   * Processes a refund or wallet credit within a Prisma transaction.
   */
  public static async processRefund(tx: any, params: CreateRefundParams) {
    const {
      transactionId,
      transactionNumber,
      branchId,
      customerId,
      amount,
      method,
      paymentReference,
      requestedById,
      approvedById,
      processedById,
      notes,
      customDate = new Date(),
    } = params;

    if (amount <= 0) {
      return null;
    }

    // 1. Generate unique refund sequence number
    const { documentNumber: refundNumber } = await ReturnNumberingService.generateDocumentNumber(
      tx,
      branchId,
      "REFUND",
      customDate
    );

    // 2. If refund method is CUSTOMER_WALLET, atomically credit wallet and create ledger
    if (method === "CUSTOMER_WALLET") {
      // Find or create customer wallet
      let wallet = await tx.customerWallet.findUnique({
        where: { customerId },
      });

      if (!wallet) {
        wallet = await tx.customerWallet.create({
          data: {
            id: `wallet_${customerId}_${Date.now()}`,
            customerId,
            cashBalance: 0,
            metal22KBalance: 0,
            metal24KBalance: 0,
            updatedAt: customDate,
          },
        });
      }

      // Update wallet balance
      await tx.customerWallet.update({
        where: { id: wallet.id },
        data: {
          cashBalance: { increment: amount },
          updatedAt: customDate,
        },
      });

      // Insert CustomerWalletLedger entry
      await tx.customerWalletLedger.create({
        data: {
          id: `cwl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          walletId: wallet.id,
          transactionType: "RETURN_CREDIT",
          assetType: "CASH",
          amount: amount,
          description: `Credit for return transaction ${transactionNumber} (${refundNumber})`,
          relatedEntityId: transactionId,
          createdAt: customDate,
        },
      });

      // Also update customer model walletBalance cache for legacy consistency
      await tx.customer.update({
        where: { id: customerId },
        data: {
          walletBalance: { increment: amount },
        },
      });
    }

    // 3. Create RefundTransaction record
    const refundRecord = await tx.refundTransaction.create({
      data: {
        refundNumber,
        transactionId,
        customerId,
        amount,
        method,
        paymentReference: paymentReference || null,
        status: "COMPLETED",
        requestedById: requestedById || null,
        approvedById: approvedById || null,
        processedById: processedById || null,
        processedAt: customDate,
        notes: notes || null,
      },
    });

    return refundRecord;
  }
}
