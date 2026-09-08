const { PrismaClient } = require('../client/src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const models = [
    'branch', 'branchSettings', 'user', 'transaction', 'category', 'subCategory', 
    'productItem', 'stoneDetail', 'customer', 'purchase', 'invoice', 'invoiceItem', 
    'invoicePayment', 'order', 'orderItem', 'advance', 'karigar', 'karigarJob', 
    'karigarJobJewellery', 'karigarHeldMetal', 'metalExchangeSession', 'metalExchangeItem', 
    'metalExchangeAudit', 'wholesaler', 'wholesalerTransaction', 'wholesalerCashItem', 
    'wholesalerLedgerEntry', 'inventoryLedger', 'inventoryTransfer', 'inventoryTransferItem', 
    'stockAudit', 'stockAuditItem', 'companySettings', 'metalRateHistory', 'productBranchCost', 
    'inventoryCostLayer', 'backupLog', 'tagDefinition', 'customerTag', 'tagAssignmentHistory', 
    'customerDocument', 'kycUploadToken', 'bookingAdvance', 'bookingAuditLog', 'bookingItem', 
    'bookingLedger', 'bookingTransfer', 'customerWallet', 'customerWalletLedger', 'deliverySession', 
    'productBooking', 'rateLockPlan', 'draftInvoice', 'savingScheme', 'schemeDeposit', 
    'schemeRedemption', 'role', 'userBranch', 'userActivityLog', 'approvalMatrix', 
    'globalProductSettings', 'orderBookSettings', 'orderVersion', 'orderApproval', 
    'orderDelayReason', 'karigarCapacity', 'branchApprovalMatrix', 'sequenceTracker', 
    'returnRequest', 'replacementRequest', 'exchangeRequest', 'creditNote', 'debitNote', 
    'huidHistory', 'auditLog', 'rFIDTag', 'rFIDReader', 'rFIDAntenna', 'rFIDZone', 
    'rFIDScanSession', 'rFIDReadEvent', 'rFIDObservation', 'rFIDException', 'rFIDAssignmentHistory', 
    'rFIDSettings', 'backupRecord', 'backupSettings', 'restoreAudit', 'systemMaintenanceState', 
    'emailSettings', 'emailJob', 'emailAuditLog', 'userSecurity', 'recoveryCode', 
    'tenantSecurityPolicy', 'securityIntegrationConfig', 'ipWhitelistRule', 'securityAuditLog', 
    'userSessionRecord', 'trustedDevice', 'securityChallenge', 'enterpriseAuditLog', 
    'technicalRequestLog', 'auditRetentionPolicy', 'goldRateHistoryLedger', 
    'returnExchangePolicySettings', 'returnExchangeTransaction', 'returnExchangeItem', 
    'returnItemPhoto', 'returnInspection', 'taxDocument', 'refundTransaction', 
    'oldGoldSettlement', 'verificationRequest', 'verificationItem', 'verificationApproval', 
    'verificationAudit', 'bullionSupplier', 'supplierLedgerEntry', 'purchaseBooking', 
    'purchaseRateSnapshot', 'purchaseInvoice', 'purchaseInvoiceItem', 'purchasePayment', 
    'purchaseMetalReceipt', 'purchaseMetalTransfer', 'purchaseReturn', 'purchaseCreditNote', 
    'purchaseDebitNote', 'purchaseGSTRecord', 'purchaseGSTPeriod', 'purchaseDocument'
  ];

  const results = {};
  for (const model of models) {
    try {
      if (prisma[model] && typeof prisma[model].count === 'function') {
        const c = await prisma[model].count();
        if (c > 0) {
          results[model] = c;
        }
      } else {
        // try lowercase / uppercase
        const keys = Object.keys(prisma).filter(k => k.toLowerCase() === model.toLowerCase());
        if (keys.length > 0 && typeof prisma[keys[0]].count === 'function') {
          const c = await prisma[keys[0]].count();
          if (c > 0) {
            results[keys[0]] = c;
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  console.log('Tables with existing rows:', results);
  await prisma.$disconnect();
}

main();
