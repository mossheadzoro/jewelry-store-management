import { NextResponse } from "next/server";
import { prisma } from "../../../../../../libs/prisma";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const customerId = parseInt(id, 10);

    if (isNaN(customerId)) {
      return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
    }

    // 1. Fetch Invoices
    const invoices = await prisma.invoice.findMany({
      where: { customerId },
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        balanceAmount: true,
        createdAt: true,
        items: { select: { product: { select: { name: true } } } },
      },
    });

    // 2. Fetch Orders
    const orders = await prisma.order.findMany({
      where: { customerId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        items: { select: { description: true } },
      },
    });

    // 3. Fetch Metal Exchange Sessions
    const metalExchanges = await prisma.metalExchangeSession.findMany({
      where: { customerId },
      select: {
        id: true,
        sessionNumber: true,
        totalWeightBefore: true,
        fineGold: true,
        createdAt: true,
        isClosed: true,
      },
    });

    // 4. Fetch Product Bookings
    const bookings = await prisma.productBooking.findMany({
      where: { customerId },
      select: {
        id: true,
        bookingNumber: true,
        totalAdvance: true,
        createdAt: true,
        rateLockStatus: true,
      },
    });

    // 5. Fetch Wallet Transactions
    const walletLedgers = await prisma.customerWalletLedger.findMany({
      where: { CustomerWallet: { customerId } },
      select: {
        id: true,
        transactionType: true,
        assetType: true,
        amount: true,
        description: true,
        createdAt: true,
        relatedEntityId: true,
      },
    });

    // 6. Fetch Saving Scheme Deposits
    const schemeDeposits = await prisma.schemeDeposit.findMany({
      where: { scheme: { customerId } },
      select: {
        id: true,
        receiptNumber: true,
        depositType: true,
        cashAmount: true,
        metalWeightGm: true,
        depositedAt: true,
        scheme: { select: { schemeNumber: true } }
      },
    });

    // 7. Fetch Saving Scheme Redemptions
    const schemeRedemptions = await prisma.schemeRedemption.findMany({
      where: { scheme: { customerId } },
      select: {
        id: true,
        amountUsed: true,
        goldWeightUsed: true,
        redeemedAt: true,
        scheme: { select: { schemeNumber: true } }
      },
    });

    // Map everything to a unified ledger format
    const ledger = [
      ...invoices.map((inv) => ({
        id: inv.id,
        type: 'INVOICE',
        title: `Invoice ${inv.invoiceNumber}`,
        amount: inv.totalAmount,
        metalWeight: null,
        status: inv.balanceAmount > 0 ? "PARTIAL" : "PAID",
        date: inv.createdAt,
        referenceId: inv.id.toString(),
        description: inv.items[0]?.product?.name || 'Jewelry Purchase',
      })),

      ...orders.map((ord) => ({
        id: ord.id,
        type: 'ORDER',
        title: `Order ${ord.orderNumber}`,
        amount: null,
        metalWeight: null,
        status: ord.status,
        date: ord.createdAt,
        referenceId: ord.id.toString(),
        description: ord.items[0]?.description || 'Custom Order',
      })),

      ...metalExchanges.map((me) => ({
        id: me.id,
        type: 'METAL_EXCHANGE',
        title: `Exchange ${me.sessionNumber}`,
        amount: null,
        metalWeight: me.totalWeightBefore,
        fineWeight: me.fineGold,
        status: me.isClosed ? "CLOSED" : "OPEN",
        date: me.createdAt,
        referenceId: me.id,
        description: `Old gold exchange - Net: ${me.fineGold}g`,
      })),

      ...bookings.map((bk) => ({
        id: bk.id,
        type: 'PRODUCT_BOOKING',
        title: `Booking ${bk.bookingNumber}`,
        amount: bk.totalAdvance,
        metalWeight: null,
        status: bk.rateLockStatus,
        date: bk.createdAt,
        referenceId: bk.id,
        description: 'Product Reservation & Rate Lock',
      })),

      ...walletLedgers.map((wl) => ({
        id: wl.id,
        type: 'WALLET',
        title: `${wl.assetType === 'CASH' ? 'Cash' : wl.assetType === 'METAL_24K' ? '24K Metal' : '22K Metal'} ${wl.transactionType === 'CREDIT' ? 'Deposited' : 'Withdrawn'}`,
        amount: wl.assetType === 'CASH' ? wl.amount : null,
        metalWeight: wl.assetType !== 'CASH' ? wl.amount : null,
        status: "COMPLETED",
        date: wl.createdAt,
        referenceId: wl.relatedEntityId || wl.id,
        description: wl.description || `${wl.transactionType === 'CREDIT' ? 'Added to' : 'Deducted from'} Wallet`,
        assetType: wl.assetType,
        transactionType: wl.transactionType,
      })),

      ...schemeDeposits.map((sd) => ({
        id: sd.id,
        type: 'SCHEME_DEPOSIT',
        title: `Scheme Deposit (${sd.scheme.schemeNumber})`,
        amount: sd.cashAmount,
        metalWeight: sd.metalWeightGm,
        status: "COMPLETED",
        date: sd.depositedAt,
        referenceId: sd.receiptNumber || sd.id,
        description: `Deposit via ${sd.depositType}`,
      })),

      ...schemeRedemptions.map((sr) => ({
        id: sr.id,
        type: 'SCHEME_REDEMPTION',
        title: `Scheme Redemption (${sr.scheme.schemeNumber})`,
        amount: sr.amountUsed,
        metalWeight: sr.goldWeightUsed,
        status: "COMPLETED",
        date: sr.redeemedAt,
        referenceId: sr.id,
        description: 'Redeemed towards invoice',
      }))
    ];

    // Sort by date descending
    ledger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ ledger });
  } catch (error) {
    console.error("[CUSTOMER_LEDGER_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch customer ledger" },
      { status: 500 }
    );
  }
}
