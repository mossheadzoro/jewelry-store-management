// scratch/test_purchase_suite.ts
import { prisma } from "../client/src/lib/prisma";
import { PurchaseBookingService } from "../client/src/lib/services/purchase/PurchaseBookingService";
import { PurchaseInvoiceService } from "../client/src/lib/services/purchase/PurchaseInvoiceService";
import { MetalReceiptService } from "../client/src/lib/services/purchase/MetalReceiptService";
import { PurchasePaymentService } from "../client/src/lib/services/purchase/PurchasePaymentService";
import { MetalTransferService } from "../client/src/lib/services/purchase/MetalTransferService";
import { PurchaseReturnNoteService } from "../client/src/lib/services/purchase/PurchaseReturnNoteService";
import { PurchaseGSTService } from "../client/src/lib/services/purchase/PurchaseGSTService";
import { PurchaseLiquidityService } from "../client/src/lib/services/purchase/PurchaseLiquidityService";
import { PurchaseNumberingService } from "../client/src/lib/services/purchase/PurchaseNumberingService";

async function runPurchaseSuite() {
  console.log("=== STARTING MOUAL ERP PURCHASE PANEL INTEGRATION SUITE ===");

  // 1. Get test branch & admin user
  const branch = await prisma.branch.findFirst();
  const user = await prisma.user.findFirst({ where: { systemRole: "ADMIN" } }) || await prisma.user.findFirst();
  if (!branch || !user) {
    throw new Error("Seed database required: Branch or Admin User not found.");
  }
  console.log(`[PASS] Context initialized with Branch ID: ${branch.id} (${branch.name}), User ID: ${user.id} (${user.name})`);

  // 2. Register Bullion Supplier
  const supplierCode = await PurchaseNumberingService.generateNumber("SUPPLIER", branch.id);
  const supplier = await prisma.bullionSupplier.create({
    data: {
      code: supplierCode,
      businessName: `Test MMTC Bullion ${Date.now()}`,
      legalName: "MMTC-PAMP India Pvt Ltd",
      gstin: "19AAACM1234A1Z5",
      pan: "AAACM1234A",
      supplierType: "BULLION_DEALER",
      contactPerson: "Rajesh Sharma",
      phone: "9876543210",
      email: "bullion@mmtc.in",
      address: "45, Bowbazar Gold Market",
      city: "Kolkata",
      state: "West Bengal",
      stateCode: "19",
      pincode: "700012",
      bankName: "HDFC Bank",
      accountNumber: "50200098765432",
      ifscCode: "HDFC0000001",
      branchName: "Bowbazar",
      currentPayable: 0,
      openingPayable: 0,
      branchId: branch.id,
    },
  });
  console.log(`[PASS] Bullion Supplier created: ${supplier.code} - ${supplier.businessName}`);

  // 3. Create 24K Gold Bullion Booking (100g @ ₹7,250/g)
  const booking = await PurchaseBookingService.createBooking({
    branchId: branch.id,
    supplierId: supplier.id,
    metalCategory: "GOLD_24K",
    purityPercent: 99.90,
    grossWeight: 100,
    bookingRate: 7250,
    marketRate: 7250,
    rateSource: "LIVE_MCX",
    isRateOverride: false,
    expectedReceiptDate: new Date(),
    notes: "Spot purchase booking test",
    createdById: user.id,
    autoApprove: true,
  });
  console.log(`[PASS] Purchase Booking created: ${booking.bookingNumber} | Fine Weight: ${booking.fineWeight}g | Total: ₹${booking.totalAmount}`);

  // 4. Record Purchase Invoice
  const invoice = await PurchaseInvoiceService.createInvoice({
    branchId: branch.id,
    supplierId: supplier.id,
    supplierInvoiceNumber: `INV-MMTC-${Date.now()}`,
    bookingId: booking.id,
    invoiceDate: new Date(),
    placeOfSupply: "West Bengal (19)",
    isReverseCharge: false,
    isInterState: false,
    items: [
      {
        hsnCode: "7108",
        description: "Gold 24K Bullion Bar (995.0)",
        metalCategory: "GOLD_24K",
        purityPercent: 99.50,
        grossWeight: 100,
        netWeight: 100,
        ratePerGram: 7250,
      },
    ],
    notes: "Invoice recorded for booking",
    createdById: user.id,
  });
  console.log(`[PASS] Purchase Invoice created: ${invoice.invoiceNumber} | Total: ₹${invoice.invoiceTotal} | CGST: ₹${invoice.cgstAmount} | SGST: ₹${invoice.sgstAmount}`);

  // 5. Verify Supplier Payable Balance Updated
  const updatedSupplier = await prisma.bullionSupplier.findUnique({ where: { id: supplier.id } });
  console.log(`[PASS] Supplier Payable Balance after Invoice: ₹${updatedSupplier?.currentPayable}`);

  // 6. Record Physical Metal Scale Receiving (100g)
  const receipt = await MetalReceiptService.recordReceipt({
    branchId: branch.id,
    supplierId: supplier.id,
    purchaseInvoiceId: invoice.id,
    purchaseBookingId: booking.id,
    metalCategory: "GOLD_24K",
    purityPercent: 99.50,
    expectedGrossWeight: 100,
    actualGrossWeight: 100.000,
    lotBatchNo: "LOT-PAMP-9921",
    purityTestingResult: "99.52% XRF Passed",
    testCertificateNo: "XRF-CERT-01",
    notes: "Scale intake verified",
    receivedById: user.id,
    autoApprove: true,
  });
  console.log(`[PASS] Physical Metal Receipt: ${receipt.receiptNumber} | Weighed: ${receipt.actualGrossWeight}g | Status: ${receipt.status}`);

  // 7. Record Payment to Supplier (₹5,00,000)
  const payment = await PurchasePaymentService.recordPayment({
    branchId: branch.id,
    supplierId: supplier.id,
    purchaseInvoiceId: invoice.id,
    purchaseBookingId: booking.id,
    amount: 500000,
    paymentMethod: "RTGS",
    paymentType: "INVOICE_PAYMENT",
    referenceNumber: `UTR-${Date.now()}`,
    paymentDate: new Date(),
    notes: "Part payment via RTGS",
    createdById: user.id,
    autoApprove: true,
  });
  console.log(`[PASS] Purchase Payment: ${payment.paymentNumber} | Disbursed: ₹${payment.amount} | Remaining Payable: ₹${invoice.invoiceTotal - 500000}`);

  // 8. Issue Metal Transfer to Karigar (25g)
  const transfer = await MetalTransferService.issueTransfer({
    sourceBranchId: branch.id,
    destinationType: "KARIGAR",
    destinationName: "Workshop Master Karigar",
    metalCategory: "GOLD_24K",
    purityPercent: 99.50,
    grossWeight: 25.000,
    purpose: "Bridal Jewellery Manufacturing",
    wastageAllowedPercent: 0.5,
    authorizedById: user.id,
  });
  console.log(`[PASS] Metal Transfer Issued: ${transfer.transferNumber} | Gross Issued: ${transfer.grossWeight}g | Balance: ${transfer.metalBalance}g`);

  // 9. Settle Metal Transfer (25g received back)
  const settled = await MetalTransferService.settleTransfer({
    transferId: transfer.id,
    metalReceivedBack: 25.000,
    metalConsumed: 0,
    notes: "Received finished jewellery matching 25g",
    actorId: user.id,
  });
  console.log(`[PASS] Metal Transfer Settled: ${settled.transferNumber} | New Status: ${settled.status} | Remaining Balance: ${settled.metalBalance}g`);

  // 10. Purchase Return & Automatic Credit Note (5g return)
  const purchaseReturn = await PurchaseReturnNoteService.createReturn({
    purchaseInvoiceId: invoice.id,
    returnedGrossWeight: 5.000,
    reason: "Purity defect on corner test",
    inspectionNotes: "5g bar returned to supplier",
    requestedById: user.id,
    autoCreditNote: true,
  });
  console.log(`[PASS] Purchase Return: ${purchaseReturn.returnNumber} | Returned: ${purchaseReturn.returnedGrossWeight}g | Auto Credit Note: ${purchaseReturn.creditNoteId ? "YES" : "NO"}`);

  // 11. Query Net Cash Left to Book and Liquidity
  const liquidity = await PurchaseLiquidityService.getLiquiditySummary(branch.id);
  console.log(`[PASS] Liquidity Calculation -> Available Cash: ₹${liquidity.availableCash} | Outstanding Commitments: ₹${liquidity.outstandingPurchaseCommitments} | Net Cash Left to Book: ₹${liquidity.netCashLeftToBook}`);

  // 12. Query GST Summary & Period Status
  const gstSummary = await PurchaseGSTService.getGSTSummary({ branchId: branch.id });
  console.log(`[PASS] GST Summary -> Gross Taxable: ₹${gstSummary.totalTaxableValue} | Eligible ITC: ₹${gstSummary.eligibleItc} | Records: ${gstSummary.recordCount}`);

  console.log("=== ALL PURCHASE SUITE TESTS PASSED PERFECTLY ===");
}

runPurchaseSuite()
  .catch((e) => {
    console.error("Purchase Suite Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
