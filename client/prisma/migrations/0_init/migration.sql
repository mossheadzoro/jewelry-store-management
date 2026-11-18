-- CreateEnum
CREATE TYPE "KarigarDepartment" AS ENUM ('GOLD', 'SILVER', 'DIAMOND');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "RemainingAction" AS ENUM ('HOLD', 'RETURN');

-- CreateEnum
CREATE TYPE "JewelleryPurity" AS ENUM ('K22', 'K20', 'K18', 'K14');

-- CreateEnum
CREATE TYPE "MetalType" AS ENUM ('GOLD', 'SILVER');

-- CreateEnum
CREATE TYPE "MetalExchangeStatus" AS ENUM ('PENDING', 'PROCESSING', 'TONCHED');

-- CreateEnum
CREATE TYPE "WholesalerTransactionType" AS ENUM ('ISSUE_METAL', 'RECEIVE_JEWELLERY');

-- CreateEnum
CREATE TYPE "WholesalerMetalType" AS ENUM ('GOLD', 'SILVER', 'DIAMOND');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'CARD', 'CHEQUE', 'NEFT', 'RTGS', 'WALLET', 'METAL', 'ADVANCE', 'OLD_GOLD_CASHOUT', 'SCHEME', 'OTHER');

-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('ADMIN', 'MANAGER', 'SALESMAN', 'VIEWER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "OrderPriority" AS ENUM ('STANDARD', 'URGENT', 'RUSH');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CREATED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "InventoryTxnType" AS ENUM ('OPENING', 'PURCHASE_IN', 'SALE_OUT', 'SALE_RETURN_IN', 'PURCHASE_RETURN_OUT', 'TRANSFER_OUT', 'TRANSFER_IN', 'KARIGAR_ISSUE_OUT', 'KARIGAR_RECEIVE_IN', 'MANUFACTURE_IN', 'DAMAGE_OUT', 'MELT_OUT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'RESERVE_OUT', 'UNRESERVE_IN', 'OLD_GOLD_IN', 'HALLMARK_OUT', 'HALLMARK_IN', 'REPAIR_ISSUE_OUT', 'REPAIR_RECEIVE_IN', 'APPROVAL_OUT', 'APPROVAL_IN', 'CONSIGNMENT_OUT', 'CONSIGNMENT_IN', 'ASSAY_OUT', 'ASSAY_IN', 'REMELTING_IN', 'BREAKAGE_ADJUST', 'CLOSING_SNAPSHOT');

-- CreateEnum
CREATE TYPE "InventoryRefType" AS ENUM ('MANUAL', 'PURCHASE', 'INVOICE', 'ORDER', 'KARIGAR_JOB', 'METAL_EXCHANGE', 'TRANSFER', 'SYSTEM', 'REPAIR_JOB', 'APPROVAL_MEMO', 'CONSIGNMENT', 'HALLMARK_BATCH', 'ASSAY_REPORT');

-- CreateEnum
CREATE TYPE "TagType" AS ENUM ('SYSTEM', 'MANUAL');

-- CreateEnum
CREATE TYPE "AdvanceType" AS ENUM ('CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'WALLET', 'METAL_22K', 'METAL_24K');

-- CreateEnum
CREATE TYPE "BookingLedgerEntryType" AS ENUM ('BOOKING_CREATED', 'ADVANCE_ADDED', 'WALLET_USED', 'RATE_LOCKED', 'DELIVERY_PARTIAL', 'DELIVERY_COMPLETE', 'CANCELLATION', 'REFUND_WALLET', 'REFUND_CASH', 'EXPIRY_EXTENDED', 'TRANSFER');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('ACTIVE', 'RATE_LOCKED', 'PARTIAL_LOCK', 'DELIVERY_PENDING', 'DELIVERED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DeliveryRatePlan" AS ENUM ('LOCK_NOW', 'SPLIT', 'MARKET_RATE', 'OPTION_A_MARKET_RATE', 'OPTION_B_15_DAY_LOCK', 'OPTION_C_METAL_WALLET', 'OPTION_D_FIXED_RATE');

-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('FULL', 'PARTIAL');

-- CreateEnum
CREATE TYPE "RateLockStatus" AS ENUM ('NO_LOCK', 'PARTIAL_LOCK', 'FULL_LOCK');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SavingSchemeType" AS ENUM ('FIXED_MONTHLY', 'ANONYMOUS_DEPOSIT', 'GOLD_DEPOSIT');

-- CreateEnum
CREATE TYPE "SchemeStatus" AS ENUM ('ACTIVE', 'MATURED', 'REDEEMED', 'PARTIALLY_REDEEMED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SchemeDepositType" AS ENUM ('CASH', 'GOLD', 'SILVER', 'OTHER_METAL', 'BONUS');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'INSPECTION_PENDING', 'INSPECTED', 'APPROVED', 'REJECTED', 'REFUNDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReplacementStatus" AS ENUM ('REQUESTED', 'INSPECTION_PENDING', 'INSPECTED', 'APPROVED', 'REJECTED', 'REPLACED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ExchangeStatus" AS ENUM ('REQUESTED', 'INSPECTION_PENDING', 'INSPECTED', 'APPROVED', 'REJECTED', 'EXCHANGED', 'CLOSED');

-- CreateEnum
CREATE TYPE "HuidStatus" AS ENUM ('AVAILABLE', 'SOLD', 'RETURNED', 'REPAIR', 'MELT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RFIDTagStatus" AS ENUM ('UNASSIGNED', 'ENCODED', 'ASSIGNED', 'ACTIVE', 'SUSPENDED', 'REPLACED', 'RETIRED');

-- CreateEnum
CREATE TYPE "RFIDConnectionType" AS ENUM ('NETWORK_TCP', 'HTTP_REST', 'WEBSOCKET', 'SERIAL_USB', 'MOCK_SIMULATOR');

-- CreateEnum
CREATE TYPE "RFIDReaderStatus" AS ENUM ('ONLINE', 'OFFLINE', 'ERROR', 'SCANNING', 'CALIBRATING');

-- CreateEnum
CREATE TYPE "RFIDZoneType" AS ENUM ('COUNTER', 'SHOWROOM', 'VAULT', 'SAFE', 'REPAIR_WORKSHOP', 'KARIGAR_DESK', 'PACKAGING', 'DISPATCH', 'RECEIVING', 'ENTRANCE_GATE');

-- CreateEnum
CREATE TYPE "RFIDScanSessionType" AS ENUM ('QUICK_SCAN', 'INVENTORY_AUDIT', 'ZONE_AUDIT', 'TRANSFER_DISPATCH', 'TRANSFER_RECEIVE', 'SAFE_AUDIT', 'BILLING_ASSIST', 'MANUAL_SCAN');

-- CreateEnum
CREATE TYPE "RFIDScanStatus" AS ENUM ('CREATED', 'SCANNING', 'REVIEW', 'APPROVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RFIDReconciliationStatus" AS ENUM ('MATCHED', 'MISSING', 'UNEXPECTED', 'WRONG_ZONE', 'WRONG_BRANCH', 'STATUS_MISMATCH', 'UNASSIGNED', 'SOLD_DETECTED');

-- CreateEnum
CREATE TYPE "RFIDExceptionType" AS ENUM ('MISSING', 'UNEXPECTED', 'WRONG_ZONE', 'WRONG_BRANCH', 'STATUS_MISMATCH', 'SOLD_ITEM_DETECTED', 'UNASSIGNED_TAG', 'SECURITY_ALERT', 'HIGH_VALUE_ALERT');

-- CreateEnum
CREATE TYPE "RFIDExceptionSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RFIDExceptionStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "RFIDResolutionType" AS ENUM ('ITEM_FOUND', 'LOCATION_UPDATED', 'TRANSFER_IN_PROGRESS', 'SALE_PENDING', 'RFID_TAG_REPLACED', 'FALSE_POSITIVE', 'MANUAL_CORRECTION', 'OTHER');

-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'MANUAL', 'PRE_RESTORE_SAFETY', 'PRE_MIGRATION');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPRESSING', 'ENCRYPTING', 'UPLOADING', 'VERIFYING', 'VERIFIED', 'FAILED', 'EXPIRED', 'RESTORING', 'RESTORED');

-- CreateEnum
CREATE TYPE "BackupStorageType" AS ENUM ('R2', 'S3_COMPATIBLE', 'AWS_S3', 'LOCAL_STORAGE');

-- CreateEnum
CREATE TYPE "ReturnExchangeType" AS ENUM ('RETURN', 'EXCHANGE');

-- CreateEnum
CREATE TYPE "ReturnExchangeStatus" AS ENUM ('DRAFT', 'REQUESTED', 'INSPECTION_PENDING', 'INSPECTED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PROCESSING', 'CREDIT_NOTE_CREATED', 'REFUND_PENDING', 'COMPLETED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ItemCondition" AS ENUM ('GOOD', 'MINOR_DAMAGE', 'MAJOR_DAMAGE', 'ALTERED', 'MISSING_STONE', 'MISSING_TAG', 'SUSPECTED_SUBSTITUTION', 'OTHER');

-- CreateEnum
CREATE TYPE "ItemInventoryRoute" AS ENUM ('RETURNED_HOLD', 'AVAILABLE', 'REPAIR', 'MELT', 'QUARANTINE');

-- CreateEnum
CREATE TYPE "RefundMethod" AS ENUM ('CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'STORE_CREDIT', 'CUSTOMER_WALLET', 'EXCHANGE_OFFSET');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaxDocumentType" AS ENUM ('INVOICE', 'CREDIT_NOTE', 'DEBIT_NOTE');

-- CreateEnum
CREATE TYPE "TaxDocReportingStatus" AS ENUM ('PENDING', 'REPORTED', 'FAILED');

-- CreateEnum
CREATE TYPE "OldGoldSettlementMode" AS ENUM ('PHYSICAL_RETURN', 'ORIGINAL_VALUE_REFUND', 'WALLET_CREDIT', 'EXCHANGE_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PhotoCategory" AS ENUM ('FRONT', 'BACK', 'SIDE', 'TAG_OR_HALLMARK', 'DETAIL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ESCALATED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "VerificationActionType" AS ENUM ('HIGH_VALUE_PURCHASE', 'RATE_OVERRIDE', 'WEIGHT_DISCREPANCY', 'SUPPLIER_CHANGE', 'PAYMENT_THRESHOLD', 'CASH_PAYMENT_THRESHOLD', 'PURCHASE_CANCEL', 'PURCHASE_RETURN', 'CREDIT_NOTE', 'DEBIT_NOTE', 'GST_ADJUSTMENT', 'GST_PERIOD_LOCK', 'METAL_TRANSFER', 'MANUAL_LEDGER_ADJUSTMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "BullionSupplierType" AS ENUM ('BULLION_DEALER', 'REFINERY', 'WHOLESALE_SUPPLIER', 'BANK', 'KARIGAR_SUPPLIER', 'OTHER');

-- CreateEnum
CREATE TYPE "SupplierGSTStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'SUSPENDED', 'UNREGISTERED', 'COMPOSITION');

-- CreateEnum
CREATE TYPE "SupplierLedgerEntryType" AS ENUM ('PURCHASE_INVOICE', 'PAYMENT', 'ADVANCE', 'CREDIT_NOTE', 'DEBIT_NOTE', 'RETURN', 'ADJUSTMENT', 'OPENING_BALANCE');

-- CreateEnum
CREATE TYPE "PurchaseBookingStatus" AS ENUM ('DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'BOOKED', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CANCELLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "BookingPaymentStatus" AS ENUM ('PAYMENT_PENDING', 'PARTIAL_PAYMENT', 'FULLY_PAID');

-- CreateEnum
CREATE TYPE "BookingMetalReceiptStatus" AS ENUM ('PENDING', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED');

-- CreateEnum
CREATE TYPE "MetalCategory" AS ENUM ('GOLD_24K', 'GOLD_22K', 'GOLD_18K', 'GOLD_14K', 'SILVER_999', 'SILVER_925', 'PLATINUM_950', 'OTHER');

-- CreateEnum
CREATE TYPE "RateSourceType" AS ENUM ('LIVE_MCX', 'SUPPLIER_FIXED', 'MANUAL_OVERRIDE', 'IBJA_BENCHMARK');

-- CreateEnum
CREATE TYPE "PurchaseInvoiceStatus" AS ENUM ('DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'POSTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PurchasePaymentStatusEnum" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID');

-- CreateEnum
CREATE TYPE "PurchasePaymentType" AS ENUM ('ADVANCE', 'INVOICE_PAYMENT', 'SETTLEMENT', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ChequeStatus" AS ENUM ('ISSUED', 'DEPOSITED', 'CLEARED', 'BOUNCED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentTxnStatus" AS ENUM ('PENDING', 'VERIFIED', 'COMPLETED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "MetalReceiptStatusEnum" AS ENUM ('RECEIVED', 'PARTIALLY_RECEIVED', 'REJECTED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "TransferDestinationType" AS ENUM ('KARIGAR', 'WHOLESALER', 'BRANCH', 'VAULT', 'OTHER');

-- CreateEnum
CREATE TYPE "MetalTransferStatusEnum" AS ENUM ('ISSUED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED', 'SETTLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PurchaseReturnStatusEnum" AS ENUM ('REQUESTED', 'INSPECTED', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NoteSettlementMode" AS ENUM ('DEDUCT_PAYABLE', 'BANK_REFUND', 'METAL_OFFSET', 'OTHER');

-- CreateEnum
CREATE TYPE "ITCReconciliationStatus" AS ENUM ('NOT_RECONCILED', 'MATCHED', 'PARTIALLY_MATCHED', 'MISMATCH', 'MISSING', 'CREDIT_NOTE_PENDING', 'ITC_ELIGIBLE', 'ITC_INELIGIBLE', 'REVIEW_REQUIRED');

-- CreateEnum
CREATE TYPE "ITCEligibilityType" AS ENUM ('ELIGIBLE', 'INELIGIBLE', 'RESTRICTED', 'BLOCKED_17_5');

-- CreateEnum
CREATE TYPE "GSTPeriodStatusEnum" AS ENUM ('DRAFT', 'REVIEW', 'VERIFIED', 'LOCKED');

-- CreateEnum
CREATE TYPE "PurchaseDocType" AS ENUM ('INVOICE_SCAN', 'BOOKING_NOTE', 'WEIGHT_SLIP', 'PURITY_CERTIFICATE', 'PAYMENT_VOUCHER', 'CREDIT_NOTE', 'DEBIT_NOTE', 'DELIVERY_CHALLAN', 'KYC_DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DocStorageProvider" AS ENUM ('CLOUDINARY', 'R2', 'LOCAL_STORAGE');

-- CreateEnum
CREATE TYPE "OCRProcessingStatus" AS ENUM ('NOT_ATTEMPTED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DocumentVerificationStatus" AS ENUM ('UNVERIFIED', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "Branch" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchSettings" (
    "id" SERIAL NOT NULL,
    "branchId" INTEGER NOT NULL,
    "shopName" TEXT,
    "gstNumber" TEXT,
    "pan" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "address" TEXT,
    "phoneNumbers" TEXT,
    "email" TEXT,
    "website" TEXT,
    "invoiceHeaderText" TEXT,
    "termsAndConditions" TEXT,
    "logoUrl" TEXT,
    "qrCodeUrl" TEXT,
    "invoiceFormat" TEXT DEFAULT 'standard',
    "invoicePageSize" TEXT DEFAULT 'A4',
    "invoiceColor" TEXT DEFAULT 'brand',
    "termsPrintLocation" TEXT DEFAULT 'front',
    "invoiceCustomizations" JSONB,
    "themeMode" TEXT DEFAULT 'light',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "image" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "systemRole" "SystemRole" NOT NULL DEFAULT 'SALESMAN',
    "roleId" INTEGER,
    "gender" "Gender",
    "branchId" INTEGER,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phone" TEXT,
    "address" TEXT,
    "aadharNumber" TEXT,
    "panNumber" TEXT,
    "salary" DOUBLE PRECISION,
    "bankAccount" TEXT,
    "ifscCode" TEXT,
    "isCommissionBased" BOOLEAN NOT NULL DEFAULT false,
    "commissionRate" DOUBLE PRECISION,
    "totalSales" DOUBLE PRECISION DEFAULT 0,
    "lastSaleDate" TIMESTAMP(3),
    "photo" TEXT,
    "signature" TEXT,
    "emergencyContact" TEXT,
    "department" TEXT,
    "joiningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLogin" TIMESTAMP(3),
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "forcePasswordReset" BOOLEAN NOT NULL DEFAULT false,
    "loginTimeStart" TEXT,
    "loginTimeEnd" TEXT,
    "allowedIps" TEXT[],
    "maxFailedAttempts" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "branchId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branchId" INTEGER NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branchId" INTEGER NOT NULL,

    CONSTRAINT "SubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "huidNumber" TEXT,
    "gsWeight" DOUBLE PRECISION NOT NULL,
    "ntWeight" DOUBLE PRECISION NOT NULL,
    "purity" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION,
    "otherCharges" TEXT,
    "otherChargesPrice" DOUBLE PRECISION,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "image" TEXT,
    "description" TEXT,
    "reservedQty" INTEGER NOT NULL DEFAULT 0,
    "size" TEXT,
    "allowNegativeStock" BOOLEAN NOT NULL DEFAULT false,
    "branchId" INTEGER NOT NULL,
    "subCategoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoneDetail" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carat" TEXT,
    "color" TEXT,
    "colorGrade" TEXT,
    "clarity" TEXT,
    "cut" TEXT,
    "shape" TEXT,
    "origin" TEXT,
    "treatment" TEXT,
    "certification" TEXT,
    "quality" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stoneImageUrl" TEXT,
    "certImageUrl" TEXT,
    "productItemId" INTEGER NOT NULL,

    CONSTRAINT "StoneDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "pan" TEXT,
    "gstin" TEXT,
    "aadhar" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "dob" TIMESTAMP(3),
    "anniversary" TIMESTAMP(3),
    "customerGroup" TEXT,
    "optInWhatsapp" BOOLEAN NOT NULL DEFAULT true,
    "optInSms" BOOLEAN NOT NULL DEFAULT true,
    "optInEmail" BOOLEAN NOT NULL DEFAULT true,
    "optInPromotions" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" SERIAL NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "createdById" INTEGER,
    "totalMetalAmount" DOUBLE PRECISION NOT NULL,
    "totalMakingAmount" DOUBLE PRECISION NOT NULL,
    "totalStoneAmount" DOUBLE PRECISION NOT NULL,
    "discountOnMaking" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxOnGold" DOUBLE PRECISION NOT NULL,
    "taxOnMaking" DOUBLE PRECISION NOT NULL,
    "taxOnHallmarking" DOUBLE PRECISION NOT NULL,
    "hallmarkingCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cgst" DOUBLE PRECISION NOT NULL,
    "sgst" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL,
    "balanceAmount" DOUBLE PRECISION NOT NULL,
    "isFullyPaid" BOOLEAN NOT NULL DEFAULT false,
    "excessGoldMode" TEXT,
    "cashSettlementRate" DOUBLE PRECISION,
    "cashOutReductionPct" DOUBLE PRECISION,
    "oldGoldCashedOut" DOUBLE PRECISION,
    "cashToCustomer" DOUBLE PRECISION,
    "refundMethod" TEXT,
    "refundDetails" TEXT,
    "excessGoldReturned" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "gsWeight" DOUBLE PRECISION NOT NULL,
    "ntWeight" DOUBLE PRECISION NOT NULL,
    "metalRate" DOUBLE PRECISION NOT NULL,
    "metalValue" DOUBLE PRECISION NOT NULL,
    "makingPercent" DOUBLE PRECISION NOT NULL,
    "makingAmount" DOUBLE PRECISION NOT NULL,
    "stoneCharge" DOUBLE PRECISION NOT NULL,
    "discountOnMaking" DOUBLE PRECISION NOT NULL,
    "totalBeforeTax" DOUBLE PRECISION NOT NULL,
    "cgst" DOUBLE PRECISION NOT NULL,
    "sgst" DOUBLE PRECISION NOT NULL,
    "totalAfterTax" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoicePayment" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentRef" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoicePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerId" INTEGER,
    "customerName" TEXT NOT NULL,
    "customerMobile" TEXT NOT NULL,
    "karigarId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'CREATED',
    "priority" "OrderPriority" NOT NULL DEFAULT 'STANDARD',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,
    "branchId" INTEGER NOT NULL,
    "wholesalerId" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "weight" DECIMAL(65,30),
    "measurement" TEXT,
    "description" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "voiceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Advance" (
    "id" TEXT NOT NULL,
    "advanceReceiptNumber" TEXT NOT NULL,
    "orderId" TEXT,
    "customerId" INTEGER NOT NULL,
    "metalType" "MetalType",
    "metalWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metalPurity" TEXT,
    "moneyAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentMethod" "PaymentMethod",
    "paymentRef" TEXT,
    "isApplied" BOOLEAN NOT NULL DEFAULT false,
    "appliedInvoiceId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Karigar" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "whatsappNumber" TEXT,
    "address" TEXT,
    "profilePhoto" TEXT,
    "adharNumber" TEXT,
    "panNumber" TEXT,
    "department" "KarigarDepartment" NOT NULL,
    "speciality" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joiningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Karigar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KarigarJob" (
    "id" TEXT NOT NULL,
    "karigarId" TEXT NOT NULL,
    "issuedWeight" DOUBLE PRECISION NOT NULL,
    "issuedPurity" DOUBLE PRECISION NOT NULL,
    "wastagePercent" DOUBLE PRECISION,
    "calculationMode" TEXT DEFAULT 'MODE_A',
    "fineUsed" DOUBLE PRECISION,
    "fineWastage" DOUBLE PRECISION,
    "remainingRawMetal" DOUBLE PRECISION,
    "remainingAction" "RemainingAction",
    "cashIssued" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "JobStatus" NOT NULL DEFAULT 'OPEN',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "KarigarJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KarigarJobJewellery" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "purity" "JewelleryPurity" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "tonch" DOUBLE PRECISION NOT NULL,
    "fineGold" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KarigarJobJewellery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KarigarHeldMetal" (
    "id" TEXT NOT NULL,
    "karigarId" TEXT NOT NULL,
    "purity" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "karigarJobId" TEXT,

    CONSTRAINT "KarigarHeldMetal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetalExchangeSession" (
    "id" TEXT NOT NULL,
    "sessionNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branchId" INTEGER NOT NULL,
    "customerId" INTEGER,
    "createdById" INTEGER,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "totalWeightBefore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalWeightAfter" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fineGold" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fineSilver" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMP(3),
    "authorizedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetalExchangeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetalExchangeItem" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "metalType" "MetalType" NOT NULL,
    "description" TEXT,
    "weightBefore" DOUBLE PRECISION NOT NULL,
    "weightAfter" DOUBLE PRECISION,
    "purityPercent" DOUBLE PRECISION,
    "tonch" DOUBLE PRECISION,
    "fineGold" DOUBLE PRECISION,
    "lossWeight" DOUBLE PRECISION,
    "status" "MetalExchangeStatus" NOT NULL DEFAULT 'PENDING',
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetalExchangeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetalExchangeAudit" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedById" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetalExchangeAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wholesaler" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerName" TEXT,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "gstNumber" TEXT,
    "panNumber" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "goldBal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "silverBal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "moneyBal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "branchId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wholesaler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WholesalerTransaction" (
    "id" TEXT NOT NULL,
    "wholesalerId" TEXT NOT NULL,
    "type" "WholesalerTransactionType" NOT NULL,
    "metalType" "WholesalerMetalType" NOT NULL,
    "purityLabel" TEXT NOT NULL DEFAULT '',
    "purityFactor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "wastage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fineWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCashAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WholesalerTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WholesalerCashItem" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "WholesalerCashItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WholesalerLedgerEntry" (
    "id" TEXT NOT NULL,
    "wholesalerId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "entryType" TEXT NOT NULL,
    "metalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WholesalerLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLedger" (
    "id" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "txnType" "InventoryTxnType" NOT NULL,
    "refType" "InventoryRefType" NOT NULL,
    "refId" TEXT,
    "qtyIn" INTEGER NOT NULL DEFAULT 0,
    "qtyOut" INTEGER NOT NULL DEFAULT 0,
    "grossWeightIn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossWeightOut" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netWeightIn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netWeightOut" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceQty" INTEGER NOT NULL DEFAULT 0,
    "balanceGrossWt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceNetWt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitCost" DOUBLE PRECISION,
    "totalValue" DOUBLE PRECISION,
    "remarks" TEXT,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "karatage" DOUBLE PRECISION,
    "purityPercent" DOUBLE PRECISION,
    "fineWeightIn" DOUBLE PRECISION,
    "fineWeightOut" DOUBLE PRECISION,
    "balanceFineWt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metalRateAtEntry" DOUBLE PRECISION,
    "metalRateUnit" TEXT,
    "metalCost" DOUBLE PRECISION,
    "stoneCost" DOUBLE PRECISION,
    "makingCharges" DOUBLE PRECISION,
    "otherCharges" DOUBLE PRECISION,
    "stoneQty" INTEGER,
    "stoneWeightCt" DOUBLE PRECISION,
    "stoneType" TEXT,
    "huidNumber" TEXT,
    "batchLotNo" TEXT,
    "hallmarkCertNo" TEXT,
    "sequenceNo" INTEGER,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "allowedWastageWt" DOUBLE PRECISION,
    "actualWastageWt" DOUBLE PRECISION,

    CONSTRAINT "InventoryLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransfer" (
    "id" TEXT NOT NULL,
    "transferNo" TEXT NOT NULL,
    "fromBranchId" INTEGER NOT NULL,
    "toBranchId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransferItem" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "grossWeight" DOUBLE PRECISION NOT NULL,
    "netWeight" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "InventoryTransferItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAudit" (
    "id" TEXT NOT NULL,
    "auditNo" TEXT NOT NULL,
    "branchId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "remarks" TEXT,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAuditItem" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "systemQty" INTEGER NOT NULL,
    "physicalQty" INTEGER NOT NULL,
    "varianceQty" INTEGER NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "StockAuditItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT 'My Jewelry Store',
    "costingMethod" TEXT NOT NULL DEFAULT 'WAC',
    "requireHuidForSales" BOOLEAN NOT NULL DEFAULT false,
    "defaultLockDays" INTEGER NOT NULL DEFAULT 90,
    "financialYearStart" INTEGER NOT NULL DEFAULT 4,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetalRateHistory" (
    "id" TEXT NOT NULL,
    "metalType" TEXT NOT NULL,
    "karatage" DOUBLE PRECISION,
    "rate" DOUBLE PRECISION NOT NULL,
    "rateUnit" TEXT NOT NULL DEFAULT 'PER_GRAM',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetalRateHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductBranchCost" (
    "id" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "avgCostPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalQty" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductBranchCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryCostLayer" (
    "id" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "qtyRemaining" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ledgerEntryId" TEXT,

    CONSTRAINT "InventoryCostLayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupLog" (
    "id" TEXT NOT NULL,
    "branchId" INTEGER NOT NULL,
    "format" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "includes" TEXT[],
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "driveFileId" TEXT,
    "driveFileUrl" TEXT,
    "branchScope" TEXT DEFAULT 'SINGLE',
    "status" TEXT DEFAULT 'SUCCESS',
    "recordCounts" JSONB,
    "type" TEXT DEFAULT 'BACKUP',

    CONSTRAINT "BackupLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "type" "TagType" NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'gray',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER,

    CONSTRAINT "TagDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerTag" (
    "id" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "tagDefinitionId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedById" INTEGER,
    "reason" TEXT,

    CONSTRAINT "CustomerTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagAssignmentHistory" (
    "id" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "tagDefinitionId" TEXT NOT NULL,
    "tagLabel" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedById" INTEGER,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TagAssignmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerDocument" (
    "id" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "iv" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "CustomerDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycUploadToken" (
    "id" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KycUploadToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingAdvance" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "advanceType" "AdvanceType" NOT NULL,
    "cashAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentRef" TEXT,
    "metalWeight" DOUBLE PRECISION,
    "metalPurity" TEXT,
    "metalRateApplied" DOUBLE PRECISION,
    "metalValueInRupees" DOUBLE PRECISION,
    "netValue" DOUBLE PRECISION NOT NULL,
    "branchId" INTEGER NOT NULL,
    "receivedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingAdvance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingAuditLog" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changedById" INTEGER,
    "previousValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingItem" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "makingChargePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weightGrams" DOUBLE PRECISION NOT NULL,
    "purity" DOUBLE PRECISION NOT NULL,
    "itemValue" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BookingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingLedger" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "entryType" "BookingLedgerEntryType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceAfter" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "performedById" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingTransfer" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fromBranchId" INTEGER NOT NULL,
    "toBranchId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "initiatedById" INTEGER,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerWallet" (
    "id" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "cashBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metal22KBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metal24KBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerWalletLedger" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "relatedEntityId" TEXT,
    "goldRateApplied" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerWalletLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliverySession" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "deliveryType" "DeliveryType" NOT NULL DEFAULT 'FULL',
    "lockedPortionValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliveryRateValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "walletAmountUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "advancePaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "outstandingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliveryGoldRate" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "PaymentMethod",
    "paymentRef" TEXT,
    "performedById" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliverySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductBooking" (
    "id" TEXT NOT NULL,
    "bookingNumber" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "createdById" INTEGER,
    "rateLockPlanId" TEXT,
    "bookingGoldRate" DOUBLE PRECISION NOT NULL,
    "rateLockStatus" "RateLockStatus" NOT NULL DEFAULT 'NO_LOCK',
    "lockedRate" DOUBLE PRECISION,
    "lockedAt" TIMESTAMP(3),
    "lockedPortion" DOUBLE PRECISION,
    "lockedWeightGrams" DOUBLE PRECISION,
    "deliveryRatePlan" "DeliveryRatePlan" NOT NULL DEFAULT 'SPLIT',
    "totalCashAdvance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalMetalAdvance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalWalletUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAdvance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "advancePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bookingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "deliveryDueDate" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "status" "BookingStatus" NOT NULL DEFAULT 'ACTIVE',
    "cancellationReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledById" INTEGER,
    "originalBranchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "additionalCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grandTotal" DOUBLE PRECISION NOT NULL,
    "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalWeightGrams" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ProductBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLockPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lockDurationDays" INTEGER NOT NULL,
    "minAdvancePercent" DOUBLE PRECISION NOT NULL,
    "rateLockPercent" DOUBLE PRECISION NOT NULL,
    "partialLockPercent" DOUBLE PRECISION NOT NULL,
    "cancellationCharge" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLockPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftInvoice" (
    "id" TEXT NOT NULL,
    "draftNumber" TEXT NOT NULL,
    "branchId" INTEGER NOT NULL,
    "customerId" INTEGER,
    "billingData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DraftInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingScheme" (
    "id" TEXT NOT NULL,
    "schemeNumber" TEXT NOT NULL,
    "type" "SavingSchemeType" NOT NULL,
    "status" "SchemeStatus" NOT NULL DEFAULT 'ACTIVE',
    "customerId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "createdById" INTEGER,
    "fixedMonthlyAmount" DOUBLE PRECISION,
    "maxDurationMonths" INTEGER NOT NULL DEFAULT 12,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "maturityDate" TIMESTAMP(3),
    "totalCashDeposited" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalGoldDepositedGm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalBonusAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "depositCount" INTEGER NOT NULL DEFAULT 0,
    "totalRedeemed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "redeemedInvoiceIds" TEXT,
    "physicalCardNumber" TEXT,
    "cardIssuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavingScheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchemeDeposit" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "depositType" "SchemeDepositType" NOT NULL,
    "cashAmount" DOUBLE PRECISION,
    "metalWeightGm" DOUBLE PRECISION,
    "metalPurity" DOUBLE PRECISION,
    "metalType" TEXT,
    "metalRatePerGm" DOUBLE PRECISION,
    "monthNumber" INTEGER,
    "isBonus" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "receiptNumber" TEXT,
    "depositedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedById" INTEGER,

    CONSTRAINT "SchemeDeposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchemeRedemption" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "invoiceId" INTEGER,
    "amountUsed" DOUBLE PRECISION NOT NULL,
    "goldWeightUsed" DOUBLE PRECISION,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,

    CONSTRAINT "SchemeRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBranch" (
    "userId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,

    CONSTRAINT "UserBranch_pkey" PRIMARY KEY ("userId","branchId")
);

-- CreateTable
CREATE TABLE "UserActivityLog" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "branchId" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalMatrix" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "requiredRoleId" INTEGER NOT NULL,

    CONSTRAINT "ApprovalMatrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalProductSettings" (
    "id" TEXT NOT NULL,
    "branchId" INTEGER,
    "metalConfig" JSONB,
    "codeConfig" JSONB,
    "weightConfig" JSONB,
    "pricingConfig" JSONB,
    "stoneConfig" JSONB,
    "hallmarkConfig" JSONB,
    "mediaConfig" JSONB,
    "inventoryConfig" JSONB,
    "printConfig" JSONB,
    "customFields" JSONB,
    "validationRules" JSONB,
    "financialConfig" JSONB,
    "schemeConfig" JSONB,
    "goldRateConfig" JSONB,
    "customerConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalProductSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderBookSettings" (
    "id" TEXT NOT NULL,
    "branchId" INTEGER NOT NULL,
    "numberingSettings" JSONB,
    "lifecycleSettings" JSONB,
    "customerSettings" JSONB,
    "multiItemSettings" JSONB,
    "designSettings" JSONB,
    "deliverySettings" JSONB,
    "karigarAssignment" JSONB,
    "advanceSettings" JSONB,
    "financialRules" JSONB,
    "cancellationRules" JSONB,
    "orderNotesSettings" JSONB,
    "printingSettings" JSONB,
    "dashboardSettings" JSONB,
    "notifications" JSONB,
    "documentSettings" JSONB,
    "rbacSettings" JSONB,
    "auditSettings" JSONB,
    "reportsSettings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderBookSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderVersion" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER,

    CONSTRAINT "OrderVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderApproval" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "customerSignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderDelayReason" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "remarks" TEXT,
    "reportedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderDelayReason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KarigarCapacity" (
    "id" TEXT NOT NULL,
    "karigarId" TEXT NOT NULL,
    "maxActiveJobs" INTEGER NOT NULL DEFAULT 5,
    "maxTotalWeight" DOUBLE PRECISION NOT NULL DEFAULT 500,

    CONSTRAINT "KarigarCapacity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchApprovalMatrix" (
    "id" TEXT NOT NULL,
    "branchId" INTEGER NOT NULL,
    "actionName" TEXT NOT NULL,
    "requiresAdminApproval" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BranchApprovalMatrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SequenceTracker" (
    "id" TEXT NOT NULL,
    "branchId" INTEGER NOT NULL,
    "categoryName" TEXT NOT NULL,
    "lastValue" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SequenceTracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnRequest" (
    "id" TEXT NOT NULL,
    "originalInvoiceId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "huidNumber" TEXT,
    "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "refundAmount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplacementRequest" (
    "id" TEXT NOT NULL,
    "originalInvoiceId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "oldHuidNumber" TEXT,
    "newHuidNumber" TEXT,
    "status" "ReplacementStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReplacementRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRequest" (
    "id" TEXT NOT NULL,
    "originalInvoiceId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "oldHuidNumber" TEXT,
    "newHuidNumber" TEXT,
    "status" "ExchangeStatus" NOT NULL DEFAULT 'REQUESTED',
    "oldValue" DOUBLE PRECISION NOT NULL,
    "newValue" DOUBLE PRECISION NOT NULL,
    "differenceAmount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditNote" (
    "id" TEXT NOT NULL,
    "returnRequestId" TEXT,
    "exchangeRequestId" TEXT,
    "taxableValue" DOUBLE PRECISION NOT NULL,
    "cgstAmount" DOUBLE PRECISION NOT NULL,
    "sgstAmount" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebitNote" (
    "id" TEXT NOT NULL,
    "exchangeRequestId" TEXT NOT NULL,
    "taxableValue" DOUBLE PRECISION NOT NULL,
    "cgstAmount" DOUBLE PRECISION NOT NULL,
    "sgstAmount" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebitNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HuidHistory" (
    "id" TEXT NOT NULL,
    "productItemId" INTEGER NOT NULL,
    "status" "HuidStatus" NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HuidHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "performedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFIDTag" (
    "id" TEXT NOT NULL,
    "epc" TEXT NOT NULL,
    "tid" TEXT,
    "status" "RFIDTagStatus" NOT NULL DEFAULT 'UNASSIGNED',
    "productItemId" INTEGER,
    "branchId" INTEGER NOT NULL,
    "currentZoneId" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "lastReaderId" TEXT,
    "lastAntenna" INTEGER,
    "lastRssi" DOUBLE PRECISION,
    "assignedAt" TIMESTAMP(3),
    "assignedById" INTEGER,
    "retiredAt" TIMESTAMP(3),
    "retiredReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFIDTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFIDReader" (
    "id" TEXT NOT NULL,
    "readerCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL DEFAULT 'Generic',
    "model" TEXT,
    "ipAddress" TEXT,
    "port" INTEGER DEFAULT 5084,
    "connectionType" "RFIDConnectionType" NOT NULL DEFAULT 'NETWORK_TCP',
    "status" "RFIDReaderStatus" NOT NULL DEFAULT 'OFFLINE',
    "powerDbm" DOUBLE PRECISION NOT NULL DEFAULT 30.0,
    "firmware" TEXT,
    "macAddress" TEXT,
    "branchId" INTEGER NOT NULL,
    "zoneId" TEXT,
    "lastHeartbeat" TIMESTAMP(3),
    "isMock" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFIDReader_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFIDAntenna" (
    "id" TEXT NOT NULL,
    "readerId" TEXT NOT NULL,
    "antennaNo" INTEGER NOT NULL,
    "name" TEXT,
    "powerDbm" DOUBLE PRECISION NOT NULL DEFAULT 30.0,
    "gainDbi" DOUBLE PRECISION NOT NULL DEFAULT 6.0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "zoneId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFIDAntenna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFIDZone" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "RFIDZoneType" NOT NULL DEFAULT 'COUNTER',
    "branchId" INTEGER NOT NULL,
    "isSecureVault" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT 'gold',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFIDZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFIDScanSession" (
    "id" TEXT NOT NULL,
    "sessionNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "RFIDScanSessionType" NOT NULL DEFAULT 'INVENTORY_AUDIT',
    "status" "RFIDScanStatus" NOT NULL DEFAULT 'CREATED',
    "branchId" INTEGER NOT NULL,
    "zoneId" TEXT,
    "readerId" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdById" INTEGER,
    "approvedById" INTEGER,
    "totalExpected" INTEGER NOT NULL DEFAULT 0,
    "totalDetected" INTEGER NOT NULL DEFAULT 0,
    "matchedCount" INTEGER NOT NULL DEFAULT 0,
    "missingCount" INTEGER NOT NULL DEFAULT 0,
    "unexpectedCount" INTEGER NOT NULL DEFAULT 0,
    "wrongZoneCount" INTEGER NOT NULL DEFAULT 0,
    "wrongBranchCount" INTEGER NOT NULL DEFAULT 0,
    "statusMismatchCount" INTEGER NOT NULL DEFAULT 0,
    "scopeFilter" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFIDScanSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFIDReadEvent" (
    "id" TEXT NOT NULL,
    "epc" TEXT NOT NULL,
    "tid" TEXT,
    "readerId" TEXT NOT NULL,
    "antennaId" TEXT,
    "branchId" INTEGER NOT NULL,
    "zoneId" TEXT,
    "scanSessionId" TEXT,
    "rssi" DOUBLE PRECISION NOT NULL DEFAULT -50.0,
    "readCount" INTEGER NOT NULL DEFAULT 1,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "frequency" DOUBLE PRECISION,
    "phase" DOUBLE PRECISION,
    "isDeduplicated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RFIDReadEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFIDObservation" (
    "id" TEXT NOT NULL,
    "scanSessionId" TEXT NOT NULL,
    "epc" TEXT NOT NULL,
    "productItemId" INTEGER,
    "reconciliationStatus" "RFIDReconciliationStatus" NOT NULL DEFAULT 'MATCHED',
    "expectedBranchId" INTEGER,
    "expectedZoneId" TEXT,
    "detectedBranchId" INTEGER NOT NULL,
    "detectedZoneId" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readCount" INTEGER NOT NULL DEFAULT 1,
    "peakRssi" DOUBLE PRECISION,
    "readerId" TEXT,
    "antennaId" TEXT,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "hasException" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RFIDObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFIDException" (
    "id" TEXT NOT NULL,
    "exceptionNo" TEXT NOT NULL,
    "type" "RFIDExceptionType" NOT NULL,
    "severity" "RFIDExceptionSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "RFIDExceptionStatus" NOT NULL DEFAULT 'OPEN',
    "scanSessionId" TEXT,
    "productItemId" INTEGER,
    "tagEpc" TEXT NOT NULL,
    "expectedBranchId" INTEGER,
    "expectedZoneId" TEXT,
    "detectedBranchId" INTEGER,
    "detectedZoneId" TEXT,
    "details" TEXT,
    "investigationNotes" TEXT,
    "resolutionType" "RFIDResolutionType",
    "resolutionNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" INTEGER,
    "authorizedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFIDException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFIDAssignmentHistory" (
    "id" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "epc" TEXT NOT NULL,
    "productItemId" INTEGER,
    "action" TEXT NOT NULL,
    "oldProductItemId" INTEGER,
    "newProductItemId" INTEGER,
    "oldStatus" TEXT,
    "newStatus" TEXT,
    "reason" TEXT,
    "performedById" INTEGER,
    "authorizedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RFIDAssignmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFIDSettings" (
    "id" TEXT NOT NULL,
    "branchId" INTEGER NOT NULL,
    "rfidEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultScanDurationSec" INTEGER NOT NULL DEFAULT 30,
    "deduplicationWindowMs" INTEGER NOT NULL DEFAULT 2000,
    "readerPollingIntervalMs" INTEGER NOT NULL DEFAULT 5000,
    "heartbeatTimeoutSec" INTEGER NOT NULL DEFAULT 30,
    "highValueThreshold" DOUBLE PRECISION NOT NULL DEFAULT 100000,
    "requireManagerAuthForReassign" BOOLEAN NOT NULL DEFAULT true,
    "requireManagerAuthForRetire" BOOLEAN NOT NULL DEFAULT true,
    "requireManagerAuthForSoldAlert" BOOLEAN NOT NULL DEFAULT true,
    "autoGenerateExceptions" BOOLEAN NOT NULL DEFAULT true,
    "soundEffectsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "mockReaderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFIDSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupRecord" (
    "id" TEXT NOT NULL,
    "backupId" TEXT NOT NULL,
    "type" "BackupType" NOT NULL DEFAULT 'MANUAL',
    "status" "BackupStatus" NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "databaseProvider" TEXT NOT NULL DEFAULT 'PostgreSQL',
    "databaseName" TEXT,
    "applicationVersion" TEXT NOT NULL DEFAULT 'v1.0.0',
    "prismaVersion" TEXT,
    "latestMigration" TEXT,
    "tablesCount" INTEGER,
    "recordsCount" INTEGER,
    "fileName" TEXT NOT NULL,
    "storageProvider" "BackupStorageType" NOT NULL DEFAULT 'R2',
    "storageBucket" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "rawSize" BIGINT,
    "fileSize" BIGINT NOT NULL,
    "checksum" TEXT NOT NULL,
    "checksumAlgorithm" TEXT NOT NULL DEFAULT 'SHA-256',
    "isEncrypted" BOOLEAN NOT NULL DEFAULT true,
    "encryptionAlgorithm" TEXT NOT NULL DEFAULT 'AES-256-GCM',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationStartedAt" TIMESTAMP(3),
    "verificationCompletedAt" TIMESTAMP(3),
    "restoreTestedAt" TIMESTAMP(3),
    "restoreTestPassed" BOOLEAN,
    "errorMessage" TEXT,
    "errorDetails" JSONB,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" INTEGER,
    "events" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "frequency" TEXT NOT NULL DEFAULT 'DAILY',
    "scheduleTime" TEXT NOT NULL DEFAULT '01:00',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "retentionDaily" INTEGER NOT NULL DEFAULT 30,
    "retentionWeekly" INTEGER NOT NULL DEFAULT 12,
    "retentionMonthly" INTEGER NOT NULL DEFAULT 12,
    "storageProvider" TEXT NOT NULL DEFAULT 'r2',
    "storageBucket" TEXT,
    "r2AccountId" TEXT,
    "r2BucketName" TEXT DEFAULT 'moual-backup',
    "r2Endpoint" TEXT,
    "r2AccessKeyId" TEXT,
    "r2SecretAccessKey" TEXT,
    "r2Region" TEXT DEFAULT 'auto',
    "localBackupPath" TEXT DEFAULT '/MoualDB-Backups',
    "saveLocalCopy" BOOLEAN NOT NULL DEFAULT true,
    "r2Connected" BOOLEAN NOT NULL DEFAULT false,
    "r2LastTestedAt" TIMESTAMP(3),
    "r2LatencyMs" INTEGER,
    "requirePreRestoreBackup" BOOLEAN NOT NULL DEFAULT true,
    "require2FAForRestore" BOOLEAN NOT NULL DEFAULT true,
    "maintenanceModeDuringRestore" BOOLEAN NOT NULL DEFAULT true,
    "lastSuccessfulBackupAt" TIMESTAMP(3),
    "lastVerifiedBackupAt" TIMESTAMP(3),
    "nextScheduledBackupAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestoreAudit" (
    "id" TEXT NOT NULL,
    "restoreId" TEXT NOT NULL,
    "backupRecordId" TEXT NOT NULL,
    "targetDatabaseType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "isDryRun" BOOLEAN NOT NULL DEFAULT false,
    "preRestoreBackupId" TEXT,
    "migrationCompatibility" JSONB,
    "validationResults" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "requestedById" INTEGER NOT NULL,
    "authorizedById" INTEGER,
    "errorMessage" TEXT,
    "logs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RestoreAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemMaintenanceState" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "isMaintenance" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "startedAt" TIMESTAMP(3),
    "startedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemMaintenanceState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default-tenant',
    "branchId" INTEGER,
    "isInherited" BOOLEAN NOT NULL DEFAULT true,
    "provider" TEXT NOT NULL DEFAULT 'ERP_MANAGED',
    "smtpHost" TEXT,
    "smtpPort" INTEGER DEFAULT 587,
    "smtpEncryption" TEXT DEFAULT 'STARTTLS',
    "smtpUsername" TEXT,
    "smtpPasswordEncrypted" TEXT,
    "providerApiKeyEncrypted" TEXT,
    "senderName" TEXT DEFAULT 'Jewellery ERP',
    "senderEmail" TEXT DEFAULT 'no-reply@jewelleryerp.com',
    "replyTo" TEXT,
    "companyLogoUrl" TEXT,
    "emailSignature" TEXT,
    "businessAddress" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "gstin" TEXT,
    "dispatchPreferences" JSONB,
    "monthlyLimit" INTEGER NOT NULL DEFAULT 5000,
    "monthlyUsage" INTEGER NOT NULL DEFAULT 0,
    "lastVerifiedAt" TIMESTAMP(3),
    "verificationStatus" TEXT DEFAULT 'PENDING',
    "verificationError" TEXT,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default-tenant',
    "branchId" INTEGER,
    "recipient" TEXT NOT NULL,
    "cc" TEXT,
    "bcc" TEXT,
    "templateId" TEXT,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "bodyText" TEXT,
    "attachments" JSONB,
    "payload" JSONB,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "providerMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailAuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default-tenant',
    "branchId" INTEGER,
    "userId" INTEGER,
    "userEmail" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSecurity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default-tenant',
    "userId" INTEGER NOT NULL,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorMethod" TEXT NOT NULL DEFAULT 'TOTP',
    "totpSecretEncrypted" TEXT,
    "totpEnabledAt" TIMESTAMP(3),
    "failedTwoFactorAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastTwoFactorVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSecurity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryCode" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default-tenant',
    "userId" INTEGER NOT NULL,
    "codeHash" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecoveryCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSecurityPolicy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default-tenant',
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "allowUserDisable2FA" BOOLEAN NOT NULL DEFAULT true,
    "require2FAAfterPasswordReset" BOOLEAN NOT NULL DEFAULT true,
    "require2FAForNewDevices" BOOLEAN NOT NULL DEFAULT false,
    "rememberTrustedDevice" BOOLEAN NOT NULL DEFAULT true,
    "trustedDeviceDurationDays" INTEGER NOT NULL DEFAULT 30,
    "twoFactorRoles" JSONB,
    "requireEnrollmentAfterFirstLogin" BOOLEAN NOT NULL DEFAULT false,
    "enrollmentGracePeriodHours" INTEGER NOT NULL DEFAULT 24,
    "blockAccessUntilEnrolled" BOOLEAN NOT NULL DEFAULT false,
    "totpIssuer" TEXT NOT NULL DEFAULT 'MOUAL ERP',
    "totpAlgorithm" TEXT NOT NULL DEFAULT 'SHA-1',
    "totpDigits" INTEGER NOT NULL DEFAULT 6,
    "totpPeriod" INTEGER NOT NULL DEFAULT 30,
    "totpTolerance" INTEGER NOT NULL DEFAULT 1,
    "recaptchaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "recaptchaActions" JSONB,
    "recaptchaLoginThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.50,
    "recaptchaPasswordResetThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.70,
    "recaptchaRecoveryThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.80,
    "ipWhitelistEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ipWhitelistMode" TEXT NOT NULL DEFAULT 'MONITOR_ONLY',
    "maxLoginAttempts" INTEGER NOT NULL DEFAULT 5,
    "lockoutDurationMinutes" INTEGER NOT NULL DEFAULT 15,
    "progressiveLockout" BOOLEAN NOT NULL DEFAULT true,
    "rateLimitLogin" BOOLEAN NOT NULL DEFAULT true,
    "rateLimitPasswordReset" BOOLEAN NOT NULL DEFAULT true,
    "rateLimit2FA" BOOLEAN NOT NULL DEFAULT true,
    "notifyAdminOnSuspiciousLogin" BOOLEAN NOT NULL DEFAULT true,
    "sessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 480,
    "idleTimeoutMinutes" INTEGER NOT NULL DEFAULT 30,
    "maxConcurrentSessions" INTEGER NOT NULL DEFAULT 5,
    "requireStepUpAuth" BOOLEAN NOT NULL DEFAULT true,
    "invalidateSessionsOnPasswordChange" BOOLEAN NOT NULL DEFAULT true,
    "invalidateSessionsOn2FAReset" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantSecurityPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityIntegrationConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default-tenant',
    "recaptchaSiteKey" TEXT,
    "recaptchaSecretKeyEncrypted" TEXT,
    "recaptchaEnvironment" TEXT NOT NULL DEFAULT 'PRODUCTION',
    "recaptchaStatus" TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
    "recaptchaLastTestedAt" TIMESTAMP(3),
    "ipDetectionMode" TEXT NOT NULL DEFAULT 'AUTO',
    "trustedProxies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "proxyHeader" TEXT NOT NULL DEFAULT 'AUTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityIntegrationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IpWhitelistRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default-tenant',
    "branchId" INTEGER,
    "ipCidr" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "appliesToRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IpWhitelistRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityAuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default-tenant',
    "userId" INTEGER,
    "userEmail" TEXT,
    "branchId" INTEGER,
    "eventType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSessionRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default-tenant',
    "userId" INTEGER NOT NULL,
    "sessionTokenHash" TEXT NOT NULL,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "ipAddress" TEXT,
    "location" TEXT,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSessionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustedDevice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default-tenant',
    "userId" INTEGER NOT NULL,
    "deviceTokenHash" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "browser" TEXT,
    "ipAddress" TEXT,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustedDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityChallenge" (
    "id" TEXT NOT NULL,
    "challengeToken" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default-tenant',
    "userId" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT '2FA_LOGIN',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnterpriseAuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default-tenant',
    "userId" INTEGER,
    "userNameSnapshot" TEXT,
    "roleSnapshot" TEXT,
    "branchId" INTEGER,
    "branchNameSnapshot" TEXT,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "entityDisplayName" TEXT,
    "description" TEXT,
    "before" JSONB,
    "after" JSONB,
    "changedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reason" TEXT,
    "approvalId" TEXT,
    "approvedById" INTEGER,
    "approvedByNameSnapshot" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceInfo" TEXT,
    "requestId" TEXT,
    "correlationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "failureReason" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "isSecurityEvent" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnterpriseAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicalRequestLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default-tenant',
    "requestId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTimeMs" INTEGER NOT NULL,
    "ipAddress" TEXT,
    "userId" INTEGER,
    "userNameSnapshot" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechnicalRequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditRetentionPolicy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default-tenant',
    "businessLogRetentionDays" INTEGER NOT NULL DEFAULT 365,
    "technicalLogRetentionDays" INTEGER NOT NULL DEFAULT 30,
    "autoArchiveEnabled" BOOLEAN NOT NULL DEFAULT false,
    "highRiskAlertEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditRetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoldRateHistoryLedger" (
    "id" TEXT NOT NULL,
    "branchId" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'LIVE_API',
    "rate24k" DOUBLE PRECISION NOT NULL,
    "rate22k" DOUBLE PRECISION NOT NULL,
    "rate18k" DOUBLE PRECISION NOT NULL,
    "rate14k" DOUBLE PRECISION NOT NULL,
    "silverRate" DOUBLE PRECISION,
    "xauUsd" DOUBLE PRECISION,
    "usdInr" DOUBLE PRECISION,
    "changeFromPrev" DOUBLE PRECISION,
    "notes" TEXT,
    "rawMetadata" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoldRateHistoryLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnExchangePolicySettings" (
    "id" TEXT NOT NULL,
    "branchId" INTEGER NOT NULL,
    "returnWindowDays" INTEGER NOT NULL DEFAULT 3,
    "exchangeWindowDays" INTEGER NOT NULL DEFAULT 7,
    "minimumReturnPhotoCount" INTEGER NOT NULL DEFAULT 2,
    "maximumReturnPhotoCount" INTEGER NOT NULL DEFAULT 5,
    "requireBarcodeVerification" BOOLEAN NOT NULL DEFAULT true,
    "requireWeightVerification" BOOLEAN NOT NULL DEFAULT true,
    "requireHuidVerification" BOOLEAN NOT NULL DEFAULT false,
    "requireRfidVerification" BOOLEAN NOT NULL DEFAULT false,
    "requirePhotoVerification" BOOLEAN NOT NULL DEFAULT true,
    "weightToleranceGrams" DOUBLE PRECISION NOT NULL DEFAULT 0.010,
    "allowStoreCredit" BOOLEAN NOT NULL DEFAULT true,
    "allowCashRefund" BOOLEAN NOT NULL DEFAULT true,
    "allowOriginalPaymentRefund" BOOLEAN NOT NULL DEFAULT true,
    "allowOldGoldPhysicalReturn" BOOLEAN NOT NULL DEFAULT true,
    "allowOldGoldMonetarySettlement" BOOLEAN NOT NULL DEFAULT true,
    "allowPolicyOverride" BOOLEAN NOT NULL DEFAULT true,
    "managerApprovalRequired" BOOLEAN NOT NULL DEFAULT true,
    "highValueApprovalThreshold" DOUBLE PRECISION NOT NULL DEFAULT 100000,
    "requireStepUpAuthAboveThreshold" BOOLEAN NOT NULL DEFAULT true,
    "makingChargeReturnPolicy" TEXT NOT NULL DEFAULT 'FULL',
    "stoneChargeReturnPolicy" TEXT NOT NULL DEFAULT 'FULL',
    "hallmarkChargeReturnPolicy" TEXT NOT NULL DEFAULT 'FULL',
    "damageDeductionPolicy" TEXT NOT NULL DEFAULT 'NONE',
    "taxAdjustmentStatutoryDays" INTEGER NOT NULL DEFAULT 180,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnExchangePolicySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnExchangeTransaction" (
    "id" TEXT NOT NULL,
    "transactionNumber" TEXT NOT NULL,
    "transactionType" "ReturnExchangeType" NOT NULL,
    "branchId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "originalInvoiceId" INTEGER NOT NULL,
    "replacementInvoiceId" INTEGER,
    "status" "ReturnExchangeStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedById" INTEGER,
    "inspectedById" INTEGER,
    "approvedById" INTEGER,
    "processedById" INTEGER,
    "policySnapshot" JSONB,
    "eligibilitySnapshot" JSONB,
    "financialSnapshot" JSONB,
    "reason" TEXT,
    "notes" TEXT,
    "rejectionReason" TEXT,
    "policyOverride" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "inspectedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "ReturnExchangeTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnExchangeItem" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "originalInvoiceItemId" INTEGER NOT NULL,
    "originalProductItemId" INTEGER NOT NULL,
    "requestedAction" "ReturnExchangeType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "originalValuesSnapshot" JSONB NOT NULL,
    "returnedValues" JSONB,
    "condition" "ItemCondition" NOT NULL DEFAULT 'GOOD',
    "inventoryRoute" "ItemInventoryRoute" NOT NULL DEFAULT 'RETURNED_HOLD',
    "returnReason" TEXT,
    "status" "ReturnExchangeStatus" NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnExchangeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnItemPhoto" (
    "id" TEXT NOT NULL,
    "returnExchangeItemId" TEXT NOT NULL,
    "photoCategory" "PhotoCategory" NOT NULL DEFAULT 'DETAIL',
    "storageUrl" TEXT NOT NULL,
    "storageKey" TEXT,
    "mimeType" TEXT NOT NULL DEFAULT 'image/jpeg',
    "sizeBytes" INTEGER,
    "sha256Hash" TEXT,
    "uploadedById" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturnItemPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnInspection" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "barcodeVerified" BOOLEAN NOT NULL DEFAULT false,
    "weightVerified" BOOLEAN NOT NULL DEFAULT false,
    "purityVerified" BOOLEAN NOT NULL DEFAULT false,
    "huidVerified" BOOLEAN NOT NULL DEFAULT false,
    "rfidVerified" BOOLEAN NOT NULL DEFAULT false,
    "stoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "photoVerified" BOOLEAN NOT NULL DEFAULT false,
    "measuredGrossWeight" DOUBLE PRECISION NOT NULL,
    "measuredNetWeight" DOUBLE PRECISION NOT NULL,
    "measuredPurity" DOUBLE PRECISION NOT NULL,
    "damageDetected" BOOLEAN NOT NULL DEFAULT false,
    "damageDescription" TEXT,
    "condition" "ItemCondition" NOT NULL DEFAULT 'GOOD',
    "inspectionNotes" TEXT,
    "inspectedById" INTEGER,
    "inspectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturnInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxDocument" (
    "id" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "documentType" "TaxDocumentType" NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branchId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "transactionId" TEXT,
    "originalInvoiceId" INTEGER NOT NULL,
    "originalInvoiceNumber" TEXT NOT NULL,
    "originalInvoiceDate" TIMESTAMP(3) NOT NULL,
    "supplierSnapshot" JSONB NOT NULL,
    "recipientSnapshot" JSONB NOT NULL,
    "recipientGstin" TEXT,
    "placeOfSupply" TEXT NOT NULL,
    "reason" TEXT,
    "taxableValue" DOUBLE PRECISION NOT NULL,
    "cgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "igstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cessAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTax" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "reportingStatus" "TaxDocReportingStatus" NOT NULL DEFAULT 'PENDING',
    "reportingReference" TEXT,
    "reportingFailureReason" TEXT,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundTransaction" (
    "id" TEXT NOT NULL,
    "refundNumber" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "RefundMethod" NOT NULL,
    "paymentReference" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" INTEGER,
    "approvedById" INTEGER,
    "processedById" INTEGER,
    "processedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefundTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OldGoldSettlement" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "originalMetalExchangeItemId" TEXT,
    "originalWeight" DOUBLE PRECISION NOT NULL,
    "originalPurity" DOUBLE PRECISION NOT NULL,
    "originalFineWeight" DOUBLE PRECISION NOT NULL,
    "originalRate" DOUBLE PRECISION NOT NULL,
    "originalValuation" DOUBLE PRECISION NOT NULL,
    "settlementMode" "OldGoldSettlementMode" NOT NULL,
    "physicalReturnAvailable" BOOLEAN NOT NULL DEFAULT false,
    "physicalReturnProcessed" BOOLEAN NOT NULL DEFAULT false,
    "monetarySettlement" DOUBLE PRECISION,
    "walletSettlement" DOUBLE PRECISION,
    "notes" TEXT,
    "approvedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OldGoldSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default-tenant',
    "branchId" INTEGER NOT NULL,
    "actionType" "VerificationActionType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityNumber" TEXT,
    "amount" DOUBLE PRECISION,
    "requiredRole" TEXT NOT NULL DEFAULT 'MANAGER',
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "riskLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "requestedById" INTEGER NOT NULL,
    "resolvedById" INTEGER,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationItem" (
    "id" TEXT NOT NULL,
    "verificationRequestId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "expectedValue" TEXT NOT NULL,
    "actualValue" TEXT NOT NULL,
    "difference" TEXT,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationApproval" (
    "id" TEXT NOT NULL,
    "verificationRequestId" TEXT NOT NULL,
    "approverId" INTEGER NOT NULL,
    "decision" "VerificationStatus" NOT NULL,
    "decisionNotes" TEXT,
    "escalatedToRole" TEXT,
    "pinVerified" BOOLEAN NOT NULL DEFAULT true,
    "stepUpTokenUsed" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationAudit" (
    "id" TEXT NOT NULL,
    "verificationRequestId" TEXT NOT NULL,
    "actorId" INTEGER,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BullionSupplier" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "legalName" TEXT,
    "gstin" TEXT,
    "pan" TEXT,
    "supplierType" "BullionSupplierType" NOT NULL DEFAULT 'BULLION_DEALER',
    "contactPerson" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL DEFAULT '19',
    "pincode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "bankName" TEXT,
    "accountNumber" TEXT,
    "ifscCode" TEXT,
    "branchName" TEXT,
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 0,
    "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gstStatus" "SupplierGSTStatus" NOT NULL DEFAULT 'ACTIVE',
    "defaultPlaceOfSupply" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "openingPayable" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentPayable" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPurchasedValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalGoldPurchasedGm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSilverPurchasedGm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "branchId" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BullionSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierLedgerEntry" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "branchId" INTEGER NOT NULL,
    "entryType" "SupplierLedgerEntryType" NOT NULL,
    "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT,
    "documentNumber" TEXT,
    "description" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseBooking" (
    "id" TEXT NOT NULL,
    "bookingNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "branchId" INTEGER NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedReceiptDate" TIMESTAMP(3),
    "metalCategory" "MetalCategory" NOT NULL DEFAULT 'GOLD_24K',
    "purityPercent" DOUBLE PRECISION NOT NULL DEFAULT 99.50,
    "grossWeight" DOUBLE PRECISION NOT NULL,
    "fineWeight" DOUBLE PRECISION NOT NULL,
    "marketRate" DOUBLE PRECISION NOT NULL,
    "bookingRate" DOUBLE PRECISION NOT NULL,
    "effectiveRate" DOUBLE PRECISION NOT NULL,
    "rateSource" "RateSourceType" NOT NULL DEFAULT 'LIVE_MCX',
    "rateTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRateLocked" BOOLEAN NOT NULL DEFAULT true,
    "isRateOverride" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "overrideUserId" INTEGER,
    "taxableValue" DOUBLE PRECISION NOT NULL,
    "estimatedGst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balancePayment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "receivedGrossWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "receivedFineWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingGrossWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "PurchaseBookingStatus" NOT NULL DEFAULT 'BOOKED',
    "paymentStatus" "BookingPaymentStatus" NOT NULL DEFAULT 'PAYMENT_PENDING',
    "metalReceiptStatus" "BookingMetalReceiptStatus" NOT NULL DEFAULT 'PENDING',
    "verificationId" TEXT,
    "notes" TEXT,
    "createdById" INTEGER,
    "verifiedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRateSnapshot" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "marketRate" DOUBLE PRECISION NOT NULL,
    "supplierRate" DOUBLE PRECISION NOT NULL,
    "finalRate" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'LIVE_API',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capturedById" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseRateSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "supplierInvoiceNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "branchId" INTEGER NOT NULL,
    "bookingId" TEXT,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "placeOfSupply" TEXT NOT NULL DEFAULT 'West Bengal (19)',
    "isReverseCharge" BOOLEAN NOT NULL DEFAULT false,
    "isInterState" BOOLEAN NOT NULL DEFAULT false,
    "totalGrossWeight" DOUBLE PRECISION NOT NULL,
    "totalFineWeight" DOUBLE PRECISION NOT NULL,
    "taxableValue" DOUBLE PRECISION NOT NULL,
    "cgstRate" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "sgstRate" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "igstRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "igstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cessAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roundOff" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "invoiceTotal" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentStatus" "PurchasePaymentStatusEnum" NOT NULL DEFAULT 'UNPAID',
    "metalReceiptStatus" "BookingMetalReceiptStatus" NOT NULL DEFAULT 'PENDING',
    "itcStatus" "ITCReconciliationStatus" NOT NULL DEFAULT 'NOT_RECONCILED',
    "status" "PurchaseInvoiceStatus" NOT NULL DEFAULT 'POSTED',
    "verificationId" TEXT,
    "notes" TEXT,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseInvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "hsnCode" TEXT NOT NULL DEFAULT '7108',
    "description" TEXT NOT NULL,
    "metalCategory" "MetalCategory" NOT NULL DEFAULT 'GOLD_24K',
    "purityPercent" DOUBLE PRECISION NOT NULL DEFAULT 99.50,
    "grossWeight" DOUBLE PRECISION NOT NULL,
    "netWeight" DOUBLE PRECISION NOT NULL,
    "fineWeight" DOUBLE PRECISION NOT NULL,
    "ratePerGram" DOUBLE PRECISION NOT NULL,
    "taxableValue" DOUBLE PRECISION NOT NULL,
    "cgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "igstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseInvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchasePayment" (
    "id" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "branchId" INTEGER NOT NULL,
    "purchaseInvoiceId" TEXT,
    "purchaseBookingId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'NEFT',
    "paymentType" "PurchasePaymentType" NOT NULL DEFAULT 'INVOICE_PAYMENT',
    "referenceNumber" TEXT,
    "chequeNumber" TEXT,
    "chequeDate" TIMESTAMP(3),
    "chequeStatus" "ChequeStatus",
    "bankName" TEXT,
    "transactionId" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "PaymentTxnStatus" NOT NULL DEFAULT 'COMPLETED',
    "idempotencyKey" TEXT,
    "verificationId" TEXT,
    "notes" TEXT,
    "createdById" INTEGER,
    "verifiedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchasePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseMetalReceipt" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "receivingBranchId" INTEGER NOT NULL,
    "purchaseInvoiceId" TEXT,
    "purchaseBookingId" TEXT,
    "metalCategory" "MetalCategory" NOT NULL DEFAULT 'GOLD_24K',
    "purityPercent" DOUBLE PRECISION NOT NULL DEFAULT 99.50,
    "expectedGrossWeight" DOUBLE PRECISION NOT NULL,
    "actualGrossWeight" DOUBLE PRECISION NOT NULL,
    "expectedFineWeight" DOUBLE PRECISION NOT NULL,
    "actualFineWeight" DOUBLE PRECISION NOT NULL,
    "weightDifference" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "receiptDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lotBatchNo" TEXT,
    "purityTestingResult" TEXT,
    "testCertificateNo" TEXT,
    "isWeightDiscrepancy" BOOLEAN NOT NULL DEFAULT false,
    "discrepancyReason" TEXT,
    "verificationId" TEXT,
    "status" "MetalReceiptStatusEnum" NOT NULL DEFAULT 'RECEIVED',
    "notes" TEXT,
    "receivedById" INTEGER,
    "verifiedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseMetalReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseMetalTransfer" (
    "id" TEXT NOT NULL,
    "transferNumber" TEXT NOT NULL,
    "sourceBranchId" INTEGER NOT NULL,
    "destinationType" "TransferDestinationType" NOT NULL DEFAULT 'KARIGAR',
    "karigarId" TEXT,
    "wholesalerId" TEXT,
    "targetBranchId" INTEGER,
    "destinationName" TEXT NOT NULL,
    "metalCategory" "MetalCategory" NOT NULL DEFAULT 'GOLD_24K',
    "purityPercent" DOUBLE PRECISION NOT NULL DEFAULT 99.50,
    "grossWeight" DOUBLE PRECISION NOT NULL,
    "fineWeight" DOUBLE PRECISION NOT NULL,
    "lotBatchNo" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedReturnDate" TIMESTAMP(3),
    "purpose" TEXT NOT NULL,
    "wastageAllowedPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metalReceivedBack" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metalConsumed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metalBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "MetalTransferStatusEnum" NOT NULL DEFAULT 'ISSUED',
    "verificationId" TEXT,
    "notes" TEXT,
    "authorizedById" INTEGER,
    "receivedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseMetalTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseReturn" (
    "id" TEXT NOT NULL,
    "returnNumber" TEXT NOT NULL,
    "purchaseInvoiceId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "branchId" INTEGER NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metalCategory" "MetalCategory" NOT NULL DEFAULT 'GOLD_24K',
    "purityPercent" DOUBLE PRECISION NOT NULL DEFAULT 99.50,
    "returnedGrossWeight" DOUBLE PRECISION NOT NULL,
    "returnedFineWeight" DOUBLE PRECISION NOT NULL,
    "taxableValue" DOUBLE PRECISION NOT NULL,
    "cgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "igstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "inspectionNotes" TEXT,
    "status" "PurchaseReturnStatusEnum" NOT NULL DEFAULT 'REQUESTED',
    "verificationId" TEXT,
    "creditNoteId" TEXT,
    "requestedById" INTEGER,
    "approvedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseCreditNote" (
    "id" TEXT NOT NULL,
    "creditNoteNumber" TEXT NOT NULL,
    "supplierCreditNoteNo" TEXT,
    "purchaseInvoiceId" TEXT,
    "purchaseReturnId" TEXT,
    "supplierId" TEXT NOT NULL,
    "branchId" INTEGER NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "originalInvoiceNumber" TEXT NOT NULL,
    "originalInvoiceDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "taxableValue" DOUBLE PRECISION NOT NULL,
    "cgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "igstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "itcReductionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "affectedGrossWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "affectedFineWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "settlementMode" "NoteSettlementMode" NOT NULL DEFAULT 'DEDUCT_PAYABLE',
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "verificationId" TEXT,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseCreditNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseDebitNote" (
    "id" TEXT NOT NULL,
    "debitNoteNumber" TEXT NOT NULL,
    "supplierDebitNoteNo" TEXT,
    "purchaseInvoiceId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "branchId" INTEGER NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "originalInvoiceNumber" TEXT NOT NULL,
    "originalInvoiceDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "taxableValue" DOUBLE PRECISION NOT NULL,
    "cgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "igstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "additionalItcAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "verificationId" TEXT,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseDebitNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseGSTRecord" (
    "id" TEXT NOT NULL,
    "branchId" INTEGER NOT NULL,
    "supplierId" TEXT NOT NULL,
    "purchaseInvoiceId" TEXT,
    "purchaseCreditNoteId" TEXT,
    "purchaseDebitNoteId" TEXT,
    "financialYear" TEXT NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "gstin" TEXT NOT NULL,
    "placeOfSupply" TEXT NOT NULL,
    "isInterState" BOOLEAN NOT NULL DEFAULT false,
    "taxableValue" DOUBLE PRECISION NOT NULL,
    "cgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "igst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTax" DOUBLE PRECISION NOT NULL,
    "itcEligibility" "ITCEligibilityType" NOT NULL DEFAULT 'ELIGIBLE',
    "itcClaimedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reconciliationStatus" "ITCReconciliationStatus" NOT NULL DEFAULT 'NOT_RECONCILED',
    "gstr2bFilingDate" TIMESTAMP(3),
    "gstr2bMatchedDate" TIMESTAMP(3),
    "supplierReportedTax" DOUBLE PRECISION,
    "taxDifference" DOUBLE PRECISION DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseGSTRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseGSTPeriod" (
    "id" TEXT NOT NULL,
    "branchId" INTEGER NOT NULL,
    "financialYear" TEXT NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "totalPurchases" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxableValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossCgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossSgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossIgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creditNoteReduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "debitNoteAddition" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "eligibleItc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ineligibleItc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netItc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reconciledCount" INTEGER NOT NULL DEFAULT 0,
    "unreconciledCount" INTEGER NOT NULL DEFAULT 0,
    "status" "GSTPeriodStatusEnum" NOT NULL DEFAULT 'DRAFT',
    "lockedAt" TIMESTAMP(3),
    "lockedById" INTEGER,
    "verificationId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseGSTPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseDocument" (
    "id" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "documentType" "PurchaseDocType" NOT NULL DEFAULT 'INVOICE_SCAN',
    "supplierId" TEXT,
    "purchaseInvoiceId" TEXT,
    "purchaseBookingId" TEXT,
    "metalReceiptId" TEXT,
    "purchasePaymentId" TEXT,
    "metalTransferId" TEXT,
    "purchaseReturnId" TEXT,
    "creditNoteId" TEXT,
    "debitNoteId" TEXT,
    "storageUrl" TEXT NOT NULL,
    "storageKey" TEXT,
    "storageProvider" "DocStorageProvider" NOT NULL DEFAULT 'CLOUDINARY',
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "fileSizeBytes" INTEGER,
    "fileHash" TEXT,
    "originalFileName" TEXT,
    "ocrStatus" "OCRProcessingStatus" NOT NULL DEFAULT 'NOT_ATTEMPTED',
    "ocrExtractedData" JSONB,
    "verificationStatus" "DocumentVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "uploadedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Branch_name_key" ON "Branch"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_email_key" ON "Branch"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BranchSettings_branchId_key" ON "BranchSettings"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_aadharNumber_key" ON "User"("aadharNumber");

-- CreateIndex
CREATE INDEX "User_branchId_idx" ON "User"("branchId");

-- CreateIndex
CREATE INDEX "User_createdById_idx" ON "User"("createdById");

-- CreateIndex
CREATE INDEX "Transaction_branchId_idx" ON "Transaction"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_branchId_key" ON "Category"("name", "branchId");

-- CreateIndex
CREATE INDEX "SubCategory_branchId_idx" ON "SubCategory"("branchId");

-- CreateIndex
CREATE INDEX "SubCategory_categoryId_idx" ON "SubCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductItem_barcode_key" ON "ProductItem"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "ProductItem_productCode_key" ON "ProductItem"("productCode");

-- CreateIndex
CREATE UNIQUE INDEX "ProductItem_huidNumber_key" ON "ProductItem"("huidNumber");

-- CreateIndex
CREATE INDEX "ProductItem_branchId_idx" ON "ProductItem"("branchId");

-- CreateIndex
CREATE INDEX "ProductItem_subCategoryId_idx" ON "ProductItem"("subCategoryId");

-- CreateIndex
CREATE INDEX "ProductItem_branchId_quantity_idx" ON "ProductItem"("branchId", "quantity");

-- CreateIndex
CREATE INDEX "ProductItem_name_idx" ON "ProductItem"("name");

-- CreateIndex
CREATE INDEX "ProductItem_createdAt_idx" ON "ProductItem"("createdAt");

-- CreateIndex
CREATE INDEX "StoneDetail_productItemId_idx" ON "StoneDetail"("productItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_mobile_key" ON "Customer"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_pan_key" ON "Customer"("pan");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_gstin_key" ON "Customer"("gstin");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_aadhar_key" ON "Customer"("aadhar");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE INDEX "Customer_createdAt_idx" ON "Customer"("createdAt");

-- CreateIndex
CREATE INDEX "Purchase_customerId_idx" ON "Purchase"("customerId");

-- CreateIndex
CREATE INDEX "Purchase_productId_idx" ON "Purchase"("productId");

-- CreateIndex
CREATE INDEX "Purchase_branchId_idx" ON "Purchase"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

-- CreateIndex
CREATE INDEX "Invoice_branchId_idx" ON "Invoice"("branchId");

-- CreateIndex
CREATE INDEX "Invoice_createdById_idx" ON "Invoice"("createdById");

-- CreateIndex
CREATE INDEX "Invoice_branchId_createdAt_idx" ON "Invoice"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "Invoice_isFullyPaid_idx" ON "Invoice"("isFullyPaid");

-- CreateIndex
CREATE INDEX "Invoice_createdAt_idx" ON "Invoice"("createdAt");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceItem_productId_idx" ON "InvoiceItem"("productId");

-- CreateIndex
CREATE INDEX "InvoicePayment_invoiceId_idx" ON "InvoicePayment"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE INDEX "Order_karigarId_idx" ON "Order"("karigarId");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_branchId_idx" ON "Order"("branchId");

-- CreateIndex
CREATE INDEX "Order_wholesalerId_idx" ON "Order"("wholesalerId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_deliveryDate_idx" ON "Order"("deliveryDate");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Order_branchId_createdAt_idx" ON "Order"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_categoryId_idx" ON "OrderItem"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Advance_advanceReceiptNumber_key" ON "Advance"("advanceReceiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Advance_orderId_key" ON "Advance"("orderId");

-- CreateIndex
CREATE INDEX "Advance_customerId_idx" ON "Advance"("customerId");

-- CreateIndex
CREATE INDEX "Advance_orderId_idx" ON "Advance"("orderId");

-- CreateIndex
CREATE INDEX "Advance_appliedInvoiceId_idx" ON "Advance"("appliedInvoiceId");

-- CreateIndex
CREATE INDEX "Advance_isApplied_idx" ON "Advance"("isApplied");

-- CreateIndex
CREATE UNIQUE INDEX "Karigar_phoneNumber_key" ON "Karigar"("phoneNumber");

-- CreateIndex
CREATE INDEX "KarigarJob_karigarId_idx" ON "KarigarJob"("karigarId");

-- CreateIndex
CREATE INDEX "KarigarJobJewellery_jobId_idx" ON "KarigarJobJewellery"("jobId");

-- CreateIndex
CREATE INDEX "KarigarHeldMetal_karigarId_idx" ON "KarigarHeldMetal"("karigarId");

-- CreateIndex
CREATE INDEX "KarigarHeldMetal_karigarJobId_idx" ON "KarigarHeldMetal"("karigarJobId");

-- CreateIndex
CREATE UNIQUE INDEX "KarigarHeldMetal_karigarId_purity_key" ON "KarigarHeldMetal"("karigarId", "purity");

-- CreateIndex
CREATE UNIQUE INDEX "MetalExchangeSession_sessionNumber_key" ON "MetalExchangeSession"("sessionNumber");

-- CreateIndex
CREATE INDEX "MetalExchangeSession_branchId_idx" ON "MetalExchangeSession"("branchId");

-- CreateIndex
CREATE INDEX "MetalExchangeSession_customerId_idx" ON "MetalExchangeSession"("customerId");

-- CreateIndex
CREATE INDEX "MetalExchangeSession_createdById_idx" ON "MetalExchangeSession"("createdById");

-- CreateIndex
CREATE INDEX "MetalExchangeItem_sessionId_idx" ON "MetalExchangeItem"("sessionId");

-- CreateIndex
CREATE INDEX "MetalExchangeItem_customerId_idx" ON "MetalExchangeItem"("customerId");

-- CreateIndex
CREATE INDEX "MetalExchangeAudit_sessionId_idx" ON "MetalExchangeAudit"("sessionId");

-- CreateIndex
CREATE INDEX "MetalExchangeAudit_performedById_idx" ON "MetalExchangeAudit"("performedById");

-- CreateIndex
CREATE UNIQUE INDEX "Wholesaler_code_key" ON "Wholesaler"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Wholesaler_phone_key" ON "Wholesaler"("phone");

-- CreateIndex
CREATE INDEX "WholesalerTransaction_wholesalerId_idx" ON "WholesalerTransaction"("wholesalerId");

-- CreateIndex
CREATE INDEX "WholesalerCashItem_transactionId_idx" ON "WholesalerCashItem"("transactionId");

-- CreateIndex
CREATE INDEX "WholesalerLedgerEntry_wholesalerId_idx" ON "WholesalerLedgerEntry"("wholesalerId");

-- CreateIndex
CREATE INDEX "WholesalerLedgerEntry_transactionId_idx" ON "WholesalerLedgerEntry"("transactionId");

-- CreateIndex
CREATE INDEX "InventoryLedger_productId_idx" ON "InventoryLedger"("productId");

-- CreateIndex
CREATE INDEX "InventoryLedger_branchId_idx" ON "InventoryLedger"("branchId");

-- CreateIndex
CREATE INDEX "InventoryLedger_txnType_idx" ON "InventoryLedger"("txnType");

-- CreateIndex
CREATE INDEX "InventoryLedger_createdAt_idx" ON "InventoryLedger"("createdAt");

-- CreateIndex
CREATE INDEX "InventoryLedger_refId_idx" ON "InventoryLedger"("refId");

-- CreateIndex
CREATE INDEX "InventoryLedger_productId_branchId_createdAt_idx" ON "InventoryLedger"("productId", "branchId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryLedger_huidNumber_idx" ON "InventoryLedger"("huidNumber");

-- CreateIndex
CREATE INDEX "InventoryLedger_sequenceNo_idx" ON "InventoryLedger"("sequenceNo");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryTransfer_transferNo_key" ON "InventoryTransfer"("transferNo");

-- CreateIndex
CREATE INDEX "InventoryTransfer_fromBranchId_idx" ON "InventoryTransfer"("fromBranchId");

-- CreateIndex
CREATE INDEX "InventoryTransfer_toBranchId_idx" ON "InventoryTransfer"("toBranchId");

-- CreateIndex
CREATE INDEX "InventoryTransferItem_transferId_idx" ON "InventoryTransferItem"("transferId");

-- CreateIndex
CREATE INDEX "InventoryTransferItem_productId_idx" ON "InventoryTransferItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "StockAudit_auditNo_key" ON "StockAudit"("auditNo");

-- CreateIndex
CREATE INDEX "StockAuditItem_auditId_idx" ON "StockAuditItem"("auditId");

-- CreateIndex
CREATE INDEX "StockAuditItem_productId_idx" ON "StockAuditItem"("productId");

-- CreateIndex
CREATE INDEX "MetalRateHistory_metalType_date_idx" ON "MetalRateHistory"("metalType", "date");

-- CreateIndex
CREATE INDEX "MetalRateHistory_karatage_idx" ON "MetalRateHistory"("karatage");

-- CreateIndex
CREATE INDEX "ProductBranchCost_productId_idx" ON "ProductBranchCost"("productId");

-- CreateIndex
CREATE INDEX "ProductBranchCost_branchId_idx" ON "ProductBranchCost"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBranchCost_productId_branchId_key" ON "ProductBranchCost"("productId", "branchId");

-- CreateIndex
CREATE INDEX "InventoryCostLayer_productId_branchId_idx" ON "InventoryCostLayer"("productId", "branchId");

-- CreateIndex
CREATE INDEX "InventoryCostLayer_createdAt_idx" ON "InventoryCostLayer"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TagDefinition_name_key" ON "TagDefinition"("name");

-- CreateIndex
CREATE INDEX "TagDefinition_branchId_idx" ON "TagDefinition"("branchId");

-- CreateIndex
CREATE INDEX "CustomerTag_customerId_idx" ON "CustomerTag"("customerId");

-- CreateIndex
CREATE INDEX "CustomerTag_tagDefinitionId_idx" ON "CustomerTag"("tagDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerTag_customerId_tagDefinitionId_key" ON "CustomerTag"("customerId", "tagDefinitionId");

-- CreateIndex
CREATE INDEX "TagAssignmentHistory_customerId_idx" ON "TagAssignmentHistory"("customerId");

-- CreateIndex
CREATE INDEX "TagAssignmentHistory_createdAt_idx" ON "TagAssignmentHistory"("createdAt");

-- CreateIndex
CREATE INDEX "CustomerDocument_customerId_idx" ON "CustomerDocument"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "KycUploadToken_token_key" ON "KycUploadToken"("token");

-- CreateIndex
CREATE INDEX "KycUploadToken_customerId_idx" ON "KycUploadToken"("customerId");

-- CreateIndex
CREATE INDEX "BookingAdvance_bookingId_idx" ON "BookingAdvance"("bookingId");

-- CreateIndex
CREATE INDEX "BookingAdvance_branchId_idx" ON "BookingAdvance"("branchId");

-- CreateIndex
CREATE INDEX "BookingAdvance_createdAt_idx" ON "BookingAdvance"("createdAt");

-- CreateIndex
CREATE INDEX "BookingAuditLog_bookingId_idx" ON "BookingAuditLog"("bookingId");

-- CreateIndex
CREATE INDEX "BookingAuditLog_createdAt_idx" ON "BookingAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "BookingItem_bookingId_idx" ON "BookingItem"("bookingId");

-- CreateIndex
CREATE INDEX "BookingItem_productId_idx" ON "BookingItem"("productId");

-- CreateIndex
CREATE INDEX "BookingLedger_bookingId_idx" ON "BookingLedger"("bookingId");

-- CreateIndex
CREATE INDEX "BookingLedger_createdAt_idx" ON "BookingLedger"("createdAt");

-- CreateIndex
CREATE INDEX "BookingTransfer_bookingId_idx" ON "BookingTransfer"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerWallet_customerId_key" ON "CustomerWallet"("customerId");

-- CreateIndex
CREATE INDEX "CustomerWallet_customerId_idx" ON "CustomerWallet"("customerId");

-- CreateIndex
CREATE INDEX "CustomerWalletLedger_createdAt_idx" ON "CustomerWalletLedger"("createdAt");

-- CreateIndex
CREATE INDEX "CustomerWalletLedger_walletId_idx" ON "CustomerWalletLedger"("walletId");

-- CreateIndex
CREATE INDEX "DeliverySession_bookingId_idx" ON "DeliverySession"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBooking_bookingNumber_key" ON "ProductBooking"("bookingNumber");

-- CreateIndex
CREATE INDEX "ProductBooking_bookingDate_idx" ON "ProductBooking"("bookingDate");

-- CreateIndex
CREATE INDEX "ProductBooking_bookingNumber_idx" ON "ProductBooking"("bookingNumber");

-- CreateIndex
CREATE INDEX "ProductBooking_branchId_idx" ON "ProductBooking"("branchId");

-- CreateIndex
CREATE INDEX "ProductBooking_customerId_idx" ON "ProductBooking"("customerId");

-- CreateIndex
CREATE INDEX "ProductBooking_expiryDate_idx" ON "ProductBooking"("expiryDate");

-- CreateIndex
CREATE INDEX "ProductBooking_status_idx" ON "ProductBooking"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DraftInvoice_draftNumber_key" ON "DraftInvoice"("draftNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SavingScheme_schemeNumber_key" ON "SavingScheme"("schemeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SavingScheme_physicalCardNumber_key" ON "SavingScheme"("physicalCardNumber");

-- CreateIndex
CREATE INDEX "SavingScheme_customerId_idx" ON "SavingScheme"("customerId");

-- CreateIndex
CREATE INDEX "SavingScheme_branchId_idx" ON "SavingScheme"("branchId");

-- CreateIndex
CREATE INDEX "SavingScheme_status_idx" ON "SavingScheme"("status");

-- CreateIndex
CREATE INDEX "SavingScheme_schemeNumber_idx" ON "SavingScheme"("schemeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SchemeDeposit_receiptNumber_key" ON "SchemeDeposit"("receiptNumber");

-- CreateIndex
CREATE INDEX "SchemeDeposit_schemeId_idx" ON "SchemeDeposit"("schemeId");

-- CreateIndex
CREATE INDEX "SchemeDeposit_depositedAt_idx" ON "SchemeDeposit"("depositedAt");

-- CreateIndex
CREATE INDEX "SchemeRedemption_schemeId_idx" ON "SchemeRedemption"("schemeId");

-- CreateIndex
CREATE INDEX "SchemeRedemption_invoiceId_idx" ON "SchemeRedemption"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE INDEX "UserBranch_userId_idx" ON "UserBranch"("userId");

-- CreateIndex
CREATE INDEX "UserBranch_branchId_idx" ON "UserBranch"("branchId");

-- CreateIndex
CREATE INDEX "UserActivityLog_userId_idx" ON "UserActivityLog"("userId");

-- CreateIndex
CREATE INDEX "UserActivityLog_createdAt_idx" ON "UserActivityLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalMatrix_action_key" ON "ApprovalMatrix"("action");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalProductSettings_branchId_key" ON "GlobalProductSettings"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderBookSettings_branchId_key" ON "OrderBookSettings"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "KarigarCapacity_karigarId_key" ON "KarigarCapacity"("karigarId");

-- CreateIndex
CREATE UNIQUE INDEX "BranchApprovalMatrix_branchId_actionName_key" ON "BranchApprovalMatrix"("branchId", "actionName");

-- CreateIndex
CREATE UNIQUE INDEX "SequenceTracker_branchId_categoryName_key" ON "SequenceTracker"("branchId", "categoryName");

-- CreateIndex
CREATE INDEX "ReturnRequest_originalInvoiceId_idx" ON "ReturnRequest"("originalInvoiceId");

-- CreateIndex
CREATE INDEX "ReturnRequest_customerId_idx" ON "ReturnRequest"("customerId");

-- CreateIndex
CREATE INDEX "ReturnRequest_huidNumber_idx" ON "ReturnRequest"("huidNumber");

-- CreateIndex
CREATE INDEX "ReplacementRequest_originalInvoiceId_idx" ON "ReplacementRequest"("originalInvoiceId");

-- CreateIndex
CREATE INDEX "ReplacementRequest_customerId_idx" ON "ReplacementRequest"("customerId");

-- CreateIndex
CREATE INDEX "ExchangeRequest_originalInvoiceId_idx" ON "ExchangeRequest"("originalInvoiceId");

-- CreateIndex
CREATE INDEX "ExchangeRequest_customerId_idx" ON "ExchangeRequest"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditNote_returnRequestId_key" ON "CreditNote"("returnRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditNote_exchangeRequestId_key" ON "CreditNote"("exchangeRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "DebitNote_exchangeRequestId_key" ON "DebitNote"("exchangeRequestId");

-- CreateIndex
CREATE INDEX "HuidHistory_productItemId_idx" ON "HuidHistory"("productItemId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_performedById_idx" ON "AuditLog"("performedById");

-- CreateIndex
CREATE UNIQUE INDEX "RFIDTag_epc_key" ON "RFIDTag"("epc");

-- CreateIndex
CREATE UNIQUE INDEX "RFIDTag_productItemId_key" ON "RFIDTag"("productItemId");

-- CreateIndex
CREATE INDEX "RFIDTag_branchId_idx" ON "RFIDTag"("branchId");

-- CreateIndex
CREATE INDEX "RFIDTag_status_idx" ON "RFIDTag"("status");

-- CreateIndex
CREATE INDEX "RFIDTag_currentZoneId_idx" ON "RFIDTag"("currentZoneId");

-- CreateIndex
CREATE INDEX "RFIDTag_lastSeenAt_idx" ON "RFIDTag"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "RFIDReader_readerCode_key" ON "RFIDReader"("readerCode");

-- CreateIndex
CREATE INDEX "RFIDReader_branchId_idx" ON "RFIDReader"("branchId");

-- CreateIndex
CREATE INDEX "RFIDReader_status_idx" ON "RFIDReader"("status");

-- CreateIndex
CREATE INDEX "RFIDReader_zoneId_idx" ON "RFIDReader"("zoneId");

-- CreateIndex
CREATE INDEX "RFIDAntenna_readerId_idx" ON "RFIDAntenna"("readerId");

-- CreateIndex
CREATE INDEX "RFIDAntenna_zoneId_idx" ON "RFIDAntenna"("zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "RFIDAntenna_readerId_antennaNo_key" ON "RFIDAntenna"("readerId", "antennaNo");

-- CreateIndex
CREATE INDEX "RFIDZone_branchId_idx" ON "RFIDZone"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "RFIDZone_branchId_code_key" ON "RFIDZone"("branchId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "RFIDScanSession_sessionNo_key" ON "RFIDScanSession"("sessionNo");

-- CreateIndex
CREATE INDEX "RFIDScanSession_branchId_idx" ON "RFIDScanSession"("branchId");

-- CreateIndex
CREATE INDEX "RFIDScanSession_status_idx" ON "RFIDScanSession"("status");

-- CreateIndex
CREATE INDEX "RFIDScanSession_createdAt_idx" ON "RFIDScanSession"("createdAt");

-- CreateIndex
CREATE INDEX "RFIDReadEvent_epc_idx" ON "RFIDReadEvent"("epc");

-- CreateIndex
CREATE INDEX "RFIDReadEvent_scanSessionId_idx" ON "RFIDReadEvent"("scanSessionId");

-- CreateIndex
CREATE INDEX "RFIDReadEvent_readerId_idx" ON "RFIDReadEvent"("readerId");

-- CreateIndex
CREATE INDEX "RFIDReadEvent_timestamp_idx" ON "RFIDReadEvent"("timestamp");

-- CreateIndex
CREATE INDEX "RFIDReadEvent_branchId_idx" ON "RFIDReadEvent"("branchId");

-- CreateIndex
CREATE INDEX "RFIDObservation_scanSessionId_idx" ON "RFIDObservation"("scanSessionId");

-- CreateIndex
CREATE INDEX "RFIDObservation_epc_idx" ON "RFIDObservation"("epc");

-- CreateIndex
CREATE INDEX "RFIDObservation_reconciliationStatus_idx" ON "RFIDObservation"("reconciliationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "RFIDObservation_scanSessionId_epc_key" ON "RFIDObservation"("scanSessionId", "epc");

-- CreateIndex
CREATE UNIQUE INDEX "RFIDException_exceptionNo_key" ON "RFIDException"("exceptionNo");

-- CreateIndex
CREATE INDEX "RFIDException_status_idx" ON "RFIDException"("status");

-- CreateIndex
CREATE INDEX "RFIDException_severity_idx" ON "RFIDException"("severity");

-- CreateIndex
CREATE INDEX "RFIDException_type_idx" ON "RFIDException"("type");

-- CreateIndex
CREATE INDEX "RFIDException_scanSessionId_idx" ON "RFIDException"("scanSessionId");

-- CreateIndex
CREATE INDEX "RFIDException_tagEpc_idx" ON "RFIDException"("tagEpc");

-- CreateIndex
CREATE INDEX "RFIDException_createdAt_idx" ON "RFIDException"("createdAt");

-- CreateIndex
CREATE INDEX "RFIDAssignmentHistory_tagId_idx" ON "RFIDAssignmentHistory"("tagId");

-- CreateIndex
CREATE INDEX "RFIDAssignmentHistory_epc_idx" ON "RFIDAssignmentHistory"("epc");

-- CreateIndex
CREATE INDEX "RFIDAssignmentHistory_productItemId_idx" ON "RFIDAssignmentHistory"("productItemId");

-- CreateIndex
CREATE INDEX "RFIDAssignmentHistory_createdAt_idx" ON "RFIDAssignmentHistory"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RFIDSettings_branchId_key" ON "RFIDSettings"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "BackupRecord_backupId_key" ON "BackupRecord"("backupId");

-- CreateIndex
CREATE INDEX "BackupRecord_status_idx" ON "BackupRecord"("status");

-- CreateIndex
CREATE INDEX "BackupRecord_type_idx" ON "BackupRecord"("type");

-- CreateIndex
CREATE INDEX "BackupRecord_createdAt_idx" ON "BackupRecord"("createdAt");

-- CreateIndex
CREATE INDEX "BackupRecord_isVerified_idx" ON "BackupRecord"("isVerified");

-- CreateIndex
CREATE UNIQUE INDEX "RestoreAudit_restoreId_key" ON "RestoreAudit"("restoreId");

-- CreateIndex
CREATE INDEX "RestoreAudit_backupRecordId_idx" ON "RestoreAudit"("backupRecordId");

-- CreateIndex
CREATE INDEX "RestoreAudit_status_idx" ON "RestoreAudit"("status");

-- CreateIndex
CREATE INDEX "RestoreAudit_createdAt_idx" ON "RestoreAudit"("createdAt");

-- CreateIndex
CREATE INDEX "EmailSettings_tenantId_idx" ON "EmailSettings"("tenantId");

-- CreateIndex
CREATE INDEX "EmailSettings_branchId_idx" ON "EmailSettings"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailSettings_tenantId_branchId_key" ON "EmailSettings"("tenantId", "branchId");

-- CreateIndex
CREATE INDEX "EmailJob_tenantId_idx" ON "EmailJob"("tenantId");

-- CreateIndex
CREATE INDEX "EmailJob_branchId_idx" ON "EmailJob"("branchId");

-- CreateIndex
CREATE INDEX "EmailJob_status_idx" ON "EmailJob"("status");

-- CreateIndex
CREATE INDEX "EmailJob_scheduledAt_idx" ON "EmailJob"("scheduledAt");

-- CreateIndex
CREATE INDEX "EmailJob_createdAt_idx" ON "EmailJob"("createdAt");

-- CreateIndex
CREATE INDEX "EmailAuditLog_tenantId_idx" ON "EmailAuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "EmailAuditLog_createdAt_idx" ON "EmailAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserSecurity_userId_key" ON "UserSecurity"("userId");

-- CreateIndex
CREATE INDEX "UserSecurity_tenantId_idx" ON "UserSecurity"("tenantId");

-- CreateIndex
CREATE INDEX "UserSecurity_userId_idx" ON "UserSecurity"("userId");

-- CreateIndex
CREATE INDEX "RecoveryCode_tenantId_idx" ON "RecoveryCode"("tenantId");

-- CreateIndex
CREATE INDEX "RecoveryCode_userId_idx" ON "RecoveryCode"("userId");

-- CreateIndex
CREATE INDEX "RecoveryCode_used_idx" ON "RecoveryCode"("used");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSecurityPolicy_tenantId_key" ON "TenantSecurityPolicy"("tenantId");

-- CreateIndex
CREATE INDEX "TenantSecurityPolicy_tenantId_idx" ON "TenantSecurityPolicy"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityIntegrationConfig_tenantId_key" ON "SecurityIntegrationConfig"("tenantId");

-- CreateIndex
CREATE INDEX "SecurityIntegrationConfig_tenantId_idx" ON "SecurityIntegrationConfig"("tenantId");

-- CreateIndex
CREATE INDEX "IpWhitelistRule_tenantId_idx" ON "IpWhitelistRule"("tenantId");

-- CreateIndex
CREATE INDEX "IpWhitelistRule_branchId_idx" ON "IpWhitelistRule"("branchId");

-- CreateIndex
CREATE INDEX "IpWhitelistRule_status_idx" ON "IpWhitelistRule"("status");

-- CreateIndex
CREATE INDEX "SecurityAuditLog_tenantId_idx" ON "SecurityAuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "SecurityAuditLog_createdAt_idx" ON "SecurityAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "SecurityAuditLog_tenantId_createdAt_idx" ON "SecurityAuditLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityAuditLog_tenantId_userId_createdAt_idx" ON "SecurityAuditLog"("tenantId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityAuditLog_tenantId_eventType_createdAt_idx" ON "SecurityAuditLog"("tenantId", "eventType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserSessionRecord_sessionTokenHash_key" ON "UserSessionRecord"("sessionTokenHash");

-- CreateIndex
CREATE INDEX "UserSessionRecord_tenantId_idx" ON "UserSessionRecord"("tenantId");

-- CreateIndex
CREATE INDEX "UserSessionRecord_userId_idx" ON "UserSessionRecord"("userId");

-- CreateIndex
CREATE INDEX "UserSessionRecord_isRevoked_idx" ON "UserSessionRecord"("isRevoked");

-- CreateIndex
CREATE UNIQUE INDEX "TrustedDevice_deviceTokenHash_key" ON "TrustedDevice"("deviceTokenHash");

-- CreateIndex
CREATE INDEX "TrustedDevice_tenantId_idx" ON "TrustedDevice"("tenantId");

-- CreateIndex
CREATE INDEX "TrustedDevice_userId_idx" ON "TrustedDevice"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityChallenge_challengeToken_key" ON "SecurityChallenge"("challengeToken");

-- CreateIndex
CREATE INDEX "SecurityChallenge_tenantId_idx" ON "SecurityChallenge"("tenantId");

-- CreateIndex
CREATE INDEX "SecurityChallenge_challengeToken_idx" ON "SecurityChallenge"("challengeToken");

-- CreateIndex
CREATE INDEX "SecurityChallenge_used_idx" ON "SecurityChallenge"("used");

-- CreateIndex
CREATE INDEX "EnterpriseAuditLog_tenantId_createdAt_idx" ON "EnterpriseAuditLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "EnterpriseAuditLog_tenantId_userId_createdAt_idx" ON "EnterpriseAuditLog"("tenantId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "EnterpriseAuditLog_tenantId_module_createdAt_idx" ON "EnterpriseAuditLog"("tenantId", "module", "createdAt");

-- CreateIndex
CREATE INDEX "EnterpriseAuditLog_tenantId_action_createdAt_idx" ON "EnterpriseAuditLog"("tenantId", "action", "createdAt");

-- CreateIndex
CREATE INDEX "EnterpriseAuditLog_tenantId_entityType_entityId_idx" ON "EnterpriseAuditLog"("tenantId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "EnterpriseAuditLog_tenantId_branchId_createdAt_idx" ON "EnterpriseAuditLog"("tenantId", "branchId", "createdAt");

-- CreateIndex
CREATE INDEX "EnterpriseAuditLog_tenantId_status_createdAt_idx" ON "EnterpriseAuditLog"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "EnterpriseAuditLog_tenantId_severity_createdAt_idx" ON "EnterpriseAuditLog"("tenantId", "severity", "createdAt");

-- CreateIndex
CREATE INDEX "EnterpriseAuditLog_tenantId_ipAddress_createdAt_idx" ON "EnterpriseAuditLog"("tenantId", "ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "EnterpriseAuditLog_tenantId_correlationId_idx" ON "EnterpriseAuditLog"("tenantId", "correlationId");

-- CreateIndex
CREATE INDEX "TechnicalRequestLog_tenantId_createdAt_idx" ON "TechnicalRequestLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "TechnicalRequestLog_tenantId_route_createdAt_idx" ON "TechnicalRequestLog"("tenantId", "route", "createdAt");

-- CreateIndex
CREATE INDEX "TechnicalRequestLog_tenantId_statusCode_createdAt_idx" ON "TechnicalRequestLog"("tenantId", "statusCode", "createdAt");

-- CreateIndex
CREATE INDEX "TechnicalRequestLog_tenantId_userId_createdAt_idx" ON "TechnicalRequestLog"("tenantId", "userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuditRetentionPolicy_tenantId_key" ON "AuditRetentionPolicy"("tenantId");

-- CreateIndex
CREATE INDEX "AuditRetentionPolicy_tenantId_idx" ON "AuditRetentionPolicy"("tenantId");

-- CreateIndex
CREATE INDEX "GoldRateHistoryLedger_branchId_recordedAt_idx" ON "GoldRateHistoryLedger"("branchId", "recordedAt");

-- CreateIndex
CREATE INDEX "GoldRateHistoryLedger_source_recordedAt_idx" ON "GoldRateHistoryLedger"("source", "recordedAt");

-- CreateIndex
CREATE INDEX "GoldRateHistoryLedger_recordedAt_idx" ON "GoldRateHistoryLedger"("recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnExchangePolicySettings_branchId_key" ON "ReturnExchangePolicySettings"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnExchangeTransaction_transactionNumber_key" ON "ReturnExchangeTransaction"("transactionNumber");

-- CreateIndex
CREATE INDEX "ReturnExchangeTransaction_transactionNumber_idx" ON "ReturnExchangeTransaction"("transactionNumber");

-- CreateIndex
CREATE INDEX "ReturnExchangeTransaction_branchId_idx" ON "ReturnExchangeTransaction"("branchId");

-- CreateIndex
CREATE INDEX "ReturnExchangeTransaction_customerId_idx" ON "ReturnExchangeTransaction"("customerId");

-- CreateIndex
CREATE INDEX "ReturnExchangeTransaction_originalInvoiceId_idx" ON "ReturnExchangeTransaction"("originalInvoiceId");

-- CreateIndex
CREATE INDEX "ReturnExchangeTransaction_status_idx" ON "ReturnExchangeTransaction"("status");

-- CreateIndex
CREATE INDEX "ReturnExchangeTransaction_createdAt_idx" ON "ReturnExchangeTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "ReturnExchangeItem_transactionId_idx" ON "ReturnExchangeItem"("transactionId");

-- CreateIndex
CREATE INDEX "ReturnExchangeItem_originalInvoiceItemId_idx" ON "ReturnExchangeItem"("originalInvoiceItemId");

-- CreateIndex
CREATE INDEX "ReturnExchangeItem_originalProductItemId_idx" ON "ReturnExchangeItem"("originalProductItemId");

-- CreateIndex
CREATE INDEX "ReturnItemPhoto_returnExchangeItemId_idx" ON "ReturnItemPhoto"("returnExchangeItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnInspection_itemId_key" ON "ReturnInspection"("itemId");

-- CreateIndex
CREATE INDEX "ReturnInspection_itemId_idx" ON "ReturnInspection"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxDocument_documentNumber_key" ON "TaxDocument"("documentNumber");

-- CreateIndex
CREATE INDEX "TaxDocument_documentNumber_idx" ON "TaxDocument"("documentNumber");

-- CreateIndex
CREATE INDEX "TaxDocument_branchId_idx" ON "TaxDocument"("branchId");

-- CreateIndex
CREATE INDEX "TaxDocument_customerId_idx" ON "TaxDocument"("customerId");

-- CreateIndex
CREATE INDEX "TaxDocument_originalInvoiceId_idx" ON "TaxDocument"("originalInvoiceId");

-- CreateIndex
CREATE INDEX "TaxDocument_financialYear_idx" ON "TaxDocument"("financialYear");

-- CreateIndex
CREATE UNIQUE INDEX "RefundTransaction_refundNumber_key" ON "RefundTransaction"("refundNumber");

-- CreateIndex
CREATE INDEX "RefundTransaction_refundNumber_idx" ON "RefundTransaction"("refundNumber");

-- CreateIndex
CREATE INDEX "RefundTransaction_transactionId_idx" ON "RefundTransaction"("transactionId");

-- CreateIndex
CREATE INDEX "RefundTransaction_customerId_idx" ON "RefundTransaction"("customerId");

-- CreateIndex
CREATE INDEX "RefundTransaction_status_idx" ON "RefundTransaction"("status");

-- CreateIndex
CREATE INDEX "OldGoldSettlement_transactionId_idx" ON "OldGoldSettlement"("transactionId");

-- CreateIndex
CREATE INDEX "OldGoldSettlement_originalMetalExchangeItemId_idx" ON "OldGoldSettlement"("originalMetalExchangeItemId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationRequest_requestNumber_key" ON "VerificationRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "VerificationRequest_branchId_idx" ON "VerificationRequest"("branchId");

-- CreateIndex
CREATE INDEX "VerificationRequest_status_idx" ON "VerificationRequest"("status");

-- CreateIndex
CREATE INDEX "VerificationRequest_entityType_entityId_idx" ON "VerificationRequest"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "VerificationRequest_createdAt_idx" ON "VerificationRequest"("createdAt");

-- CreateIndex
CREATE INDEX "VerificationItem_verificationRequestId_idx" ON "VerificationItem"("verificationRequestId");

-- CreateIndex
CREATE INDEX "VerificationApproval_verificationRequestId_idx" ON "VerificationApproval"("verificationRequestId");

-- CreateIndex
CREATE INDEX "VerificationApproval_approverId_idx" ON "VerificationApproval"("approverId");

-- CreateIndex
CREATE INDEX "VerificationAudit_verificationRequestId_idx" ON "VerificationAudit"("verificationRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "BullionSupplier_code_key" ON "BullionSupplier"("code");

-- CreateIndex
CREATE INDEX "BullionSupplier_code_idx" ON "BullionSupplier"("code");

-- CreateIndex
CREATE INDEX "BullionSupplier_gstin_idx" ON "BullionSupplier"("gstin");

-- CreateIndex
CREATE INDEX "BullionSupplier_phone_idx" ON "BullionSupplier"("phone");

-- CreateIndex
CREATE INDEX "BullionSupplier_isActive_idx" ON "BullionSupplier"("isActive");

-- CreateIndex
CREATE INDEX "SupplierLedgerEntry_supplierId_transactionDate_idx" ON "SupplierLedgerEntry"("supplierId", "transactionDate");

-- CreateIndex
CREATE INDEX "SupplierLedgerEntry_branchId_idx" ON "SupplierLedgerEntry"("branchId");

-- CreateIndex
CREATE INDEX "SupplierLedgerEntry_referenceType_referenceId_idx" ON "SupplierLedgerEntry"("referenceType", "referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseBooking_bookingNumber_key" ON "PurchaseBooking"("bookingNumber");

-- CreateIndex
CREATE INDEX "PurchaseBooking_bookingNumber_idx" ON "PurchaseBooking"("bookingNumber");

-- CreateIndex
CREATE INDEX "PurchaseBooking_supplierId_idx" ON "PurchaseBooking"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseBooking_branchId_idx" ON "PurchaseBooking"("branchId");

-- CreateIndex
CREATE INDEX "PurchaseBooking_status_idx" ON "PurchaseBooking"("status");

-- CreateIndex
CREATE INDEX "PurchaseBooking_bookingDate_idx" ON "PurchaseBooking"("bookingDate");

-- CreateIndex
CREATE INDEX "PurchaseRateSnapshot_bookingId_idx" ON "PurchaseRateSnapshot"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseInvoice_invoiceNumber_key" ON "PurchaseInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "PurchaseInvoice_invoiceNumber_idx" ON "PurchaseInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "PurchaseInvoice_supplierId_idx" ON "PurchaseInvoice"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseInvoice_branchId_idx" ON "PurchaseInvoice"("branchId");

-- CreateIndex
CREATE INDEX "PurchaseInvoice_status_idx" ON "PurchaseInvoice"("status");

-- CreateIndex
CREATE INDEX "PurchaseInvoice_invoiceDate_idx" ON "PurchaseInvoice"("invoiceDate");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseInvoice_supplierId_supplierInvoiceNumber_key" ON "PurchaseInvoice"("supplierId", "supplierInvoiceNumber");

-- CreateIndex
CREATE INDEX "PurchaseInvoiceItem_invoiceId_idx" ON "PurchaseInvoiceItem"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchasePayment_paymentNumber_key" ON "PurchasePayment"("paymentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PurchasePayment_idempotencyKey_key" ON "PurchasePayment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PurchasePayment_paymentNumber_idx" ON "PurchasePayment"("paymentNumber");

-- CreateIndex
CREATE INDEX "PurchasePayment_supplierId_idx" ON "PurchasePayment"("supplierId");

-- CreateIndex
CREATE INDEX "PurchasePayment_branchId_idx" ON "PurchasePayment"("branchId");

-- CreateIndex
CREATE INDEX "PurchasePayment_paymentDate_idx" ON "PurchasePayment"("paymentDate");

-- CreateIndex
CREATE INDEX "PurchasePayment_status_idx" ON "PurchasePayment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseMetalReceipt_receiptNumber_key" ON "PurchaseMetalReceipt"("receiptNumber");

-- CreateIndex
CREATE INDEX "PurchaseMetalReceipt_receiptNumber_idx" ON "PurchaseMetalReceipt"("receiptNumber");

-- CreateIndex
CREATE INDEX "PurchaseMetalReceipt_supplierId_idx" ON "PurchaseMetalReceipt"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseMetalReceipt_receivingBranchId_idx" ON "PurchaseMetalReceipt"("receivingBranchId");

-- CreateIndex
CREATE INDEX "PurchaseMetalReceipt_receiptDate_idx" ON "PurchaseMetalReceipt"("receiptDate");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseMetalTransfer_transferNumber_key" ON "PurchaseMetalTransfer"("transferNumber");

-- CreateIndex
CREATE INDEX "PurchaseMetalTransfer_transferNumber_idx" ON "PurchaseMetalTransfer"("transferNumber");

-- CreateIndex
CREATE INDEX "PurchaseMetalTransfer_sourceBranchId_idx" ON "PurchaseMetalTransfer"("sourceBranchId");

-- CreateIndex
CREATE INDEX "PurchaseMetalTransfer_destinationType_idx" ON "PurchaseMetalTransfer"("destinationType");

-- CreateIndex
CREATE INDEX "PurchaseMetalTransfer_karigarId_idx" ON "PurchaseMetalTransfer"("karigarId");

-- CreateIndex
CREATE INDEX "PurchaseMetalTransfer_wholesalerId_idx" ON "PurchaseMetalTransfer"("wholesalerId");

-- CreateIndex
CREATE INDEX "PurchaseMetalTransfer_status_idx" ON "PurchaseMetalTransfer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseReturn_returnNumber_key" ON "PurchaseReturn"("returnNumber");

-- CreateIndex
CREATE INDEX "PurchaseReturn_returnNumber_idx" ON "PurchaseReturn"("returnNumber");

-- CreateIndex
CREATE INDEX "PurchaseReturn_supplierId_idx" ON "PurchaseReturn"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseReturn_branchId_idx" ON "PurchaseReturn"("branchId");

-- CreateIndex
CREATE INDEX "PurchaseReturn_purchaseInvoiceId_idx" ON "PurchaseReturn"("purchaseInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseCreditNote_creditNoteNumber_key" ON "PurchaseCreditNote"("creditNoteNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseCreditNote_purchaseReturnId_key" ON "PurchaseCreditNote"("purchaseReturnId");

-- CreateIndex
CREATE INDEX "PurchaseCreditNote_creditNoteNumber_idx" ON "PurchaseCreditNote"("creditNoteNumber");

-- CreateIndex
CREATE INDEX "PurchaseCreditNote_supplierId_idx" ON "PurchaseCreditNote"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseCreditNote_branchId_idx" ON "PurchaseCreditNote"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseDebitNote_debitNoteNumber_key" ON "PurchaseDebitNote"("debitNoteNumber");

-- CreateIndex
CREATE INDEX "PurchaseDebitNote_debitNoteNumber_idx" ON "PurchaseDebitNote"("debitNoteNumber");

-- CreateIndex
CREATE INDEX "PurchaseDebitNote_supplierId_idx" ON "PurchaseDebitNote"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseDebitNote_branchId_idx" ON "PurchaseDebitNote"("branchId");

-- CreateIndex
CREATE INDEX "PurchaseGSTRecord_financialYear_periodMonth_idx" ON "PurchaseGSTRecord"("financialYear", "periodMonth");

-- CreateIndex
CREATE INDEX "PurchaseGSTRecord_branchId_idx" ON "PurchaseGSTRecord"("branchId");

-- CreateIndex
CREATE INDEX "PurchaseGSTRecord_supplierId_idx" ON "PurchaseGSTRecord"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseGSTRecord_reconciliationStatus_idx" ON "PurchaseGSTRecord"("reconciliationStatus");

-- CreateIndex
CREATE INDEX "PurchaseGSTPeriod_financialYear_periodMonth_idx" ON "PurchaseGSTPeriod"("financialYear", "periodMonth");

-- CreateIndex
CREATE INDEX "PurchaseGSTPeriod_status_idx" ON "PurchaseGSTPeriod"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseGSTPeriod_branchId_financialYear_periodMonth_key" ON "PurchaseGSTPeriod"("branchId", "financialYear", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseDocument_documentNumber_key" ON "PurchaseDocument"("documentNumber");

-- CreateIndex
CREATE INDEX "PurchaseDocument_supplierId_idx" ON "PurchaseDocument"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseDocument_purchaseInvoiceId_idx" ON "PurchaseDocument"("purchaseInvoiceId");

-- CreateIndex
CREATE INDEX "PurchaseDocument_purchaseBookingId_idx" ON "PurchaseDocument"("purchaseBookingId");

-- CreateIndex
CREATE INDEX "PurchaseDocument_documentType_idx" ON "PurchaseDocument"("documentType");

-- AddForeignKey
ALTER TABLE "BranchSettings" ADD CONSTRAINT "BranchSettings_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubCategory" ADD CONSTRAINT "SubCategory_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubCategory" ADD CONSTRAINT "SubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductItem" ADD CONSTRAINT "ProductItem_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductItem" ADD CONSTRAINT "ProductItem_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoneDetail" ADD CONSTRAINT "StoneDetail_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES "ProductItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_karigarId_fkey" FOREIGN KEY ("karigarId") REFERENCES "Karigar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_wholesalerId_fkey" FOREIGN KEY ("wholesalerId") REFERENCES "Wholesaler"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advance" ADD CONSTRAINT "Advance_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advance" ADD CONSTRAINT "Advance_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KarigarJob" ADD CONSTRAINT "KarigarJob_karigarId_fkey" FOREIGN KEY ("karigarId") REFERENCES "Karigar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KarigarJobJewellery" ADD CONSTRAINT "KarigarJobJewellery_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "KarigarJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KarigarHeldMetal" ADD CONSTRAINT "KarigarHeldMetal_karigarId_fkey" FOREIGN KEY ("karigarId") REFERENCES "Karigar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KarigarHeldMetal" ADD CONSTRAINT "KarigarHeldMetal_karigarJobId_fkey" FOREIGN KEY ("karigarJobId") REFERENCES "KarigarJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalExchangeSession" ADD CONSTRAINT "MetalExchangeSession_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalExchangeSession" ADD CONSTRAINT "MetalExchangeSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalExchangeSession" ADD CONSTRAINT "MetalExchangeSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalExchangeItem" ADD CONSTRAINT "MetalExchangeItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalExchangeItem" ADD CONSTRAINT "MetalExchangeItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MetalExchangeSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalExchangeAudit" ADD CONSTRAINT "MetalExchangeAudit_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalExchangeAudit" ADD CONSTRAINT "MetalExchangeAudit_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MetalExchangeSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wholesaler" ADD CONSTRAINT "Wholesaler_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesalerTransaction" ADD CONSTRAINT "WholesalerTransaction_wholesalerId_fkey" FOREIGN KEY ("wholesalerId") REFERENCES "Wholesaler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesalerCashItem" ADD CONSTRAINT "WholesalerCashItem_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "WholesalerTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesalerLedgerEntry" ADD CONSTRAINT "WholesalerLedgerEntry_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "WholesalerTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesalerLedgerEntry" ADD CONSTRAINT "WholesalerLedgerEntry_wholesalerId_fkey" FOREIGN KEY ("wholesalerId") REFERENCES "Wholesaler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLedger" ADD CONSTRAINT "InventoryLedger_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLedger" ADD CONSTRAINT "InventoryLedger_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLedger" ADD CONSTRAINT "InventoryLedger_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_fromBranchId_fkey" FOREIGN KEY ("fromBranchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_toBranchId_fkey" FOREIGN KEY ("toBranchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransferItem" ADD CONSTRAINT "InventoryTransferItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransferItem" ADD CONSTRAINT "InventoryTransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "InventoryTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAudit" ADD CONSTRAINT "StockAudit_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAudit" ADD CONSTRAINT "StockAudit_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAuditItem" ADD CONSTRAINT "StockAuditItem_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "StockAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAuditItem" ADD CONSTRAINT "StockAuditItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBranchCost" ADD CONSTRAINT "ProductBranchCost_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBranchCost" ADD CONSTRAINT "ProductBranchCost_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryCostLayer" ADD CONSTRAINT "InventoryCostLayer_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryCostLayer" ADD CONSTRAINT "InventoryCostLayer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagDefinition" ADD CONSTRAINT "TagDefinition_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagDefinition" ADD CONSTRAINT "TagDefinition_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTag" ADD CONSTRAINT "CustomerTag_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTag" ADD CONSTRAINT "CustomerTag_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTag" ADD CONSTRAINT "CustomerTag_tagDefinitionId_fkey" FOREIGN KEY ("tagDefinitionId") REFERENCES "TagDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerDocument" ADD CONSTRAINT "CustomerDocument_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycUploadToken" ADD CONSTRAINT "KycUploadToken_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAdvance" ADD CONSTRAINT "BookingAdvance_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ProductBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAdvance" ADD CONSTRAINT "BookingAdvance_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAdvance" ADD CONSTRAINT "BookingAdvance_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAuditLog" ADD CONSTRAINT "BookingAuditLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ProductBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAuditLog" ADD CONSTRAINT "BookingAuditLog_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingItem" ADD CONSTRAINT "BookingItem_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ProductBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingItem" ADD CONSTRAINT "BookingItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingLedger" ADD CONSTRAINT "BookingLedger_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ProductBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingLedger" ADD CONSTRAINT "BookingLedger_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingTransfer" ADD CONSTRAINT "BookingTransfer_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ProductBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingTransfer" ADD CONSTRAINT "BookingTransfer_fromBranchId_fkey" FOREIGN KEY ("fromBranchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingTransfer" ADD CONSTRAINT "BookingTransfer_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingTransfer" ADD CONSTRAINT "BookingTransfer_toBranchId_fkey" FOREIGN KEY ("toBranchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerWallet" ADD CONSTRAINT "CustomerWallet_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerWalletLedger" ADD CONSTRAINT "CustomerWalletLedger_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "CustomerWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliverySession" ADD CONSTRAINT "DeliverySession_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ProductBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliverySession" ADD CONSTRAINT "DeliverySession_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBooking" ADD CONSTRAINT "ProductBooking_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBooking" ADD CONSTRAINT "ProductBooking_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBooking" ADD CONSTRAINT "ProductBooking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBooking" ADD CONSTRAINT "ProductBooking_rateLockPlanId_fkey" FOREIGN KEY ("rateLockPlanId") REFERENCES "RateLockPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftInvoice" ADD CONSTRAINT "DraftInvoice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftInvoice" ADD CONSTRAINT "DraftInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingScheme" ADD CONSTRAINT "SavingScheme_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingScheme" ADD CONSTRAINT "SavingScheme_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingScheme" ADD CONSTRAINT "SavingScheme_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchemeDeposit" ADD CONSTRAINT "SchemeDeposit_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "SavingScheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchemeRedemption" ADD CONSTRAINT "SchemeRedemption_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "SavingScheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBranch" ADD CONSTRAINT "UserBranch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBranch" ADD CONSTRAINT "UserBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivityLog" ADD CONSTRAINT "UserActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalMatrix" ADD CONSTRAINT "ApprovalMatrix_requiredRoleId_fkey" FOREIGN KEY ("requiredRoleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderBookSettings" ADD CONSTRAINT "OrderBookSettings_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderVersion" ADD CONSTRAINT "OrderVersion_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderVersion" ADD CONSTRAINT "OrderVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderApproval" ADD CONSTRAINT "OrderApproval_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDelayReason" ADD CONSTRAINT "OrderDelayReason_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDelayReason" ADD CONSTRAINT "OrderDelayReason_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KarigarCapacity" ADD CONSTRAINT "KarigarCapacity_karigarId_fkey" FOREIGN KEY ("karigarId") REFERENCES "Karigar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchApprovalMatrix" ADD CONSTRAINT "BranchApprovalMatrix_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_originalInvoiceId_fkey" FOREIGN KEY ("originalInvoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplacementRequest" ADD CONSTRAINT "ReplacementRequest_originalInvoiceId_fkey" FOREIGN KEY ("originalInvoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplacementRequest" ADD CONSTRAINT "ReplacementRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeRequest" ADD CONSTRAINT "ExchangeRequest_originalInvoiceId_fkey" FOREIGN KEY ("originalInvoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeRequest" ADD CONSTRAINT "ExchangeRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_returnRequestId_fkey" FOREIGN KEY ("returnRequestId") REFERENCES "ReturnRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_exchangeRequestId_fkey" FOREIGN KEY ("exchangeRequestId") REFERENCES "ExchangeRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebitNote" ADD CONSTRAINT "DebitNote_exchangeRequestId_fkey" FOREIGN KEY ("exchangeRequestId") REFERENCES "ExchangeRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuidHistory" ADD CONSTRAINT "HuidHistory_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES "ProductItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDTag" ADD CONSTRAINT "RFIDTag_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES "ProductItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDTag" ADD CONSTRAINT "RFIDTag_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDTag" ADD CONSTRAINT "RFIDTag_currentZoneId_fkey" FOREIGN KEY ("currentZoneId") REFERENCES "RFIDZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDTag" ADD CONSTRAINT "RFIDTag_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDTag" ADD CONSTRAINT "RFIDTag_lastReaderId_fkey" FOREIGN KEY ("lastReaderId") REFERENCES "RFIDReader"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDReader" ADD CONSTRAINT "RFIDReader_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDReader" ADD CONSTRAINT "RFIDReader_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "RFIDZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDAntenna" ADD CONSTRAINT "RFIDAntenna_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "RFIDReader"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDAntenna" ADD CONSTRAINT "RFIDAntenna_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "RFIDZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDZone" ADD CONSTRAINT "RFIDZone_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDScanSession" ADD CONSTRAINT "RFIDScanSession_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDScanSession" ADD CONSTRAINT "RFIDScanSession_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "RFIDZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDScanSession" ADD CONSTRAINT "RFIDScanSession_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "RFIDReader"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDScanSession" ADD CONSTRAINT "RFIDScanSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDScanSession" ADD CONSTRAINT "RFIDScanSession_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDReadEvent" ADD CONSTRAINT "RFIDReadEvent_epc_fkey" FOREIGN KEY ("epc") REFERENCES "RFIDTag"("epc") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDReadEvent" ADD CONSTRAINT "RFIDReadEvent_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "RFIDReader"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDReadEvent" ADD CONSTRAINT "RFIDReadEvent_antennaId_fkey" FOREIGN KEY ("antennaId") REFERENCES "RFIDAntenna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDReadEvent" ADD CONSTRAINT "RFIDReadEvent_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDReadEvent" ADD CONSTRAINT "RFIDReadEvent_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "RFIDZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDReadEvent" ADD CONSTRAINT "RFIDReadEvent_scanSessionId_fkey" FOREIGN KEY ("scanSessionId") REFERENCES "RFIDScanSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDObservation" ADD CONSTRAINT "RFIDObservation_scanSessionId_fkey" FOREIGN KEY ("scanSessionId") REFERENCES "RFIDScanSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDObservation" ADD CONSTRAINT "RFIDObservation_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES "ProductItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDException" ADD CONSTRAINT "RFIDException_scanSessionId_fkey" FOREIGN KEY ("scanSessionId") REFERENCES "RFIDScanSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDException" ADD CONSTRAINT "RFIDException_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES "ProductItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDException" ADD CONSTRAINT "RFIDException_tagEpc_fkey" FOREIGN KEY ("tagEpc") REFERENCES "RFIDTag"("epc") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDException" ADD CONSTRAINT "RFIDException_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDException" ADD CONSTRAINT "RFIDException_authorizedById_fkey" FOREIGN KEY ("authorizedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDException" ADD CONSTRAINT "RFIDException_expectedZoneId_fkey" FOREIGN KEY ("expectedZoneId") REFERENCES "RFIDZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDException" ADD CONSTRAINT "RFIDException_detectedZoneId_fkey" FOREIGN KEY ("detectedZoneId") REFERENCES "RFIDZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDAssignmentHistory" ADD CONSTRAINT "RFIDAssignmentHistory_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "RFIDTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDAssignmentHistory" ADD CONSTRAINT "RFIDAssignmentHistory_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES "ProductItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDAssignmentHistory" ADD CONSTRAINT "RFIDAssignmentHistory_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDAssignmentHistory" ADD CONSTRAINT "RFIDAssignmentHistory_authorizedById_fkey" FOREIGN KEY ("authorizedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDSettings" ADD CONSTRAINT "RFIDSettings_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupRecord" ADD CONSTRAINT "BackupRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestoreAudit" ADD CONSTRAINT "RestoreAudit_backupRecordId_fkey" FOREIGN KEY ("backupRecordId") REFERENCES "BackupRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestoreAudit" ADD CONSTRAINT "RestoreAudit_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestoreAudit" ADD CONSTRAINT "RestoreAudit_authorizedById_fkey" FOREIGN KEY ("authorizedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSecurity" ADD CONSTRAINT "UserSecurity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoldRateHistoryLedger" ADD CONSTRAINT "GoldRateHistoryLedger_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnExchangePolicySettings" ADD CONSTRAINT "ReturnExchangePolicySettings_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnExchangeTransaction" ADD CONSTRAINT "ReturnExchangeTransaction_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnExchangeTransaction" ADD CONSTRAINT "ReturnExchangeTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnExchangeTransaction" ADD CONSTRAINT "ReturnExchangeTransaction_originalInvoiceId_fkey" FOREIGN KEY ("originalInvoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnExchangeTransaction" ADD CONSTRAINT "ReturnExchangeTransaction_replacementInvoiceId_fkey" FOREIGN KEY ("replacementInvoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnExchangeTransaction" ADD CONSTRAINT "ReturnExchangeTransaction_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnExchangeTransaction" ADD CONSTRAINT "ReturnExchangeTransaction_inspectedById_fkey" FOREIGN KEY ("inspectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnExchangeTransaction" ADD CONSTRAINT "ReturnExchangeTransaction_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnExchangeTransaction" ADD CONSTRAINT "ReturnExchangeTransaction_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnExchangeItem" ADD CONSTRAINT "ReturnExchangeItem_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "ReturnExchangeTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnExchangeItem" ADD CONSTRAINT "ReturnExchangeItem_originalInvoiceItemId_fkey" FOREIGN KEY ("originalInvoiceItemId") REFERENCES "InvoiceItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnExchangeItem" ADD CONSTRAINT "ReturnExchangeItem_originalProductItemId_fkey" FOREIGN KEY ("originalProductItemId") REFERENCES "ProductItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItemPhoto" ADD CONSTRAINT "ReturnItemPhoto_returnExchangeItemId_fkey" FOREIGN KEY ("returnExchangeItemId") REFERENCES "ReturnExchangeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItemPhoto" ADD CONSTRAINT "ReturnItemPhoto_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnInspection" ADD CONSTRAINT "ReturnInspection_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ReturnExchangeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnInspection" ADD CONSTRAINT "ReturnInspection_inspectedById_fkey" FOREIGN KEY ("inspectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDocument" ADD CONSTRAINT "TaxDocument_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDocument" ADD CONSTRAINT "TaxDocument_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDocument" ADD CONSTRAINT "TaxDocument_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "ReturnExchangeTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDocument" ADD CONSTRAINT "TaxDocument_originalInvoiceId_fkey" FOREIGN KEY ("originalInvoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundTransaction" ADD CONSTRAINT "RefundTransaction_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "ReturnExchangeTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundTransaction" ADD CONSTRAINT "RefundTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundTransaction" ADD CONSTRAINT "RefundTransaction_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundTransaction" ADD CONSTRAINT "RefundTransaction_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundTransaction" ADD CONSTRAINT "RefundTransaction_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OldGoldSettlement" ADD CONSTRAINT "OldGoldSettlement_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "ReturnExchangeTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OldGoldSettlement" ADD CONSTRAINT "OldGoldSettlement_originalMetalExchangeItemId_fkey" FOREIGN KEY ("originalMetalExchangeItemId") REFERENCES "MetalExchangeItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OldGoldSettlement" ADD CONSTRAINT "OldGoldSettlement_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationItem" ADD CONSTRAINT "VerificationItem_verificationRequestId_fkey" FOREIGN KEY ("verificationRequestId") REFERENCES "VerificationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationApproval" ADD CONSTRAINT "VerificationApproval_verificationRequestId_fkey" FOREIGN KEY ("verificationRequestId") REFERENCES "VerificationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationApproval" ADD CONSTRAINT "VerificationApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationAudit" ADD CONSTRAINT "VerificationAudit_verificationRequestId_fkey" FOREIGN KEY ("verificationRequestId") REFERENCES "VerificationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationAudit" ADD CONSTRAINT "VerificationAudit_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BullionSupplier" ADD CONSTRAINT "BullionSupplier_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierLedgerEntry" ADD CONSTRAINT "SupplierLedgerEntry_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "BullionSupplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierLedgerEntry" ADD CONSTRAINT "SupplierLedgerEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseBooking" ADD CONSTRAINT "PurchaseBooking_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "BullionSupplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseBooking" ADD CONSTRAINT "PurchaseBooking_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseBooking" ADD CONSTRAINT "PurchaseBooking_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseBooking" ADD CONSTRAINT "PurchaseBooking_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRateSnapshot" ADD CONSTRAINT "PurchaseRateSnapshot_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "PurchaseBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInvoice" ADD CONSTRAINT "PurchaseInvoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "BullionSupplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInvoice" ADD CONSTRAINT "PurchaseInvoice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInvoice" ADD CONSTRAINT "PurchaseInvoice_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "PurchaseBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInvoice" ADD CONSTRAINT "PurchaseInvoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInvoiceItem" ADD CONSTRAINT "PurchaseInvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "PurchaseInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasePayment" ADD CONSTRAINT "PurchasePayment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "BullionSupplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasePayment" ADD CONSTRAINT "PurchasePayment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasePayment" ADD CONSTRAINT "PurchasePayment_purchaseInvoiceId_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "PurchaseInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasePayment" ADD CONSTRAINT "PurchasePayment_purchaseBookingId_fkey" FOREIGN KEY ("purchaseBookingId") REFERENCES "PurchaseBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasePayment" ADD CONSTRAINT "PurchasePayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasePayment" ADD CONSTRAINT "PurchasePayment_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseMetalReceipt" ADD CONSTRAINT "PurchaseMetalReceipt_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "BullionSupplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseMetalReceipt" ADD CONSTRAINT "PurchaseMetalReceipt_receivingBranchId_fkey" FOREIGN KEY ("receivingBranchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseMetalReceipt" ADD CONSTRAINT "PurchaseMetalReceipt_purchaseInvoiceId_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "PurchaseInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseMetalReceipt" ADD CONSTRAINT "PurchaseMetalReceipt_purchaseBookingId_fkey" FOREIGN KEY ("purchaseBookingId") REFERENCES "PurchaseBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseMetalReceipt" ADD CONSTRAINT "PurchaseMetalReceipt_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseMetalReceipt" ADD CONSTRAINT "PurchaseMetalReceipt_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseMetalTransfer" ADD CONSTRAINT "PurchaseMetalTransfer_sourceBranchId_fkey" FOREIGN KEY ("sourceBranchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseMetalTransfer" ADD CONSTRAINT "PurchaseMetalTransfer_karigarId_fkey" FOREIGN KEY ("karigarId") REFERENCES "Karigar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseMetalTransfer" ADD CONSTRAINT "PurchaseMetalTransfer_wholesalerId_fkey" FOREIGN KEY ("wholesalerId") REFERENCES "Wholesaler"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseMetalTransfer" ADD CONSTRAINT "PurchaseMetalTransfer_authorizedById_fkey" FOREIGN KEY ("authorizedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseMetalTransfer" ADD CONSTRAINT "PurchaseMetalTransfer_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturn" ADD CONSTRAINT "PurchaseReturn_purchaseInvoiceId_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "PurchaseInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturn" ADD CONSTRAINT "PurchaseReturn_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "BullionSupplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturn" ADD CONSTRAINT "PurchaseReturn_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturn" ADD CONSTRAINT "PurchaseReturn_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturn" ADD CONSTRAINT "PurchaseReturn_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseCreditNote" ADD CONSTRAINT "PurchaseCreditNote_purchaseInvoiceId_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "PurchaseInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseCreditNote" ADD CONSTRAINT "PurchaseCreditNote_purchaseReturnId_fkey" FOREIGN KEY ("purchaseReturnId") REFERENCES "PurchaseReturn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseCreditNote" ADD CONSTRAINT "PurchaseCreditNote_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "BullionSupplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseCreditNote" ADD CONSTRAINT "PurchaseCreditNote_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseCreditNote" ADD CONSTRAINT "PurchaseCreditNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseDebitNote" ADD CONSTRAINT "PurchaseDebitNote_purchaseInvoiceId_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "PurchaseInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseDebitNote" ADD CONSTRAINT "PurchaseDebitNote_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "BullionSupplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseDebitNote" ADD CONSTRAINT "PurchaseDebitNote_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseDebitNote" ADD CONSTRAINT "PurchaseDebitNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseGSTRecord" ADD CONSTRAINT "PurchaseGSTRecord_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseGSTRecord" ADD CONSTRAINT "PurchaseGSTRecord_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "BullionSupplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseGSTRecord" ADD CONSTRAINT "PurchaseGSTRecord_purchaseInvoiceId_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "PurchaseInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseGSTRecord" ADD CONSTRAINT "PurchaseGSTRecord_purchaseCreditNoteId_fkey" FOREIGN KEY ("purchaseCreditNoteId") REFERENCES "PurchaseCreditNote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseGSTRecord" ADD CONSTRAINT "PurchaseGSTRecord_purchaseDebitNoteId_fkey" FOREIGN KEY ("purchaseDebitNoteId") REFERENCES "PurchaseDebitNote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseGSTPeriod" ADD CONSTRAINT "PurchaseGSTPeriod_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseGSTPeriod" ADD CONSTRAINT "PurchaseGSTPeriod_lockedById_fkey" FOREIGN KEY ("lockedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseDocument" ADD CONSTRAINT "PurchaseDocument_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "BullionSupplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseDocument" ADD CONSTRAINT "PurchaseDocument_purchaseInvoiceId_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "PurchaseInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseDocument" ADD CONSTRAINT "PurchaseDocument_purchaseBookingId_fkey" FOREIGN KEY ("purchaseBookingId") REFERENCES "PurchaseBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseDocument" ADD CONSTRAINT "PurchaseDocument_metalReceiptId_fkey" FOREIGN KEY ("metalReceiptId") REFERENCES "PurchaseMetalReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseDocument" ADD CONSTRAINT "PurchaseDocument_purchasePaymentId_fkey" FOREIGN KEY ("purchasePaymentId") REFERENCES "PurchasePayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseDocument" ADD CONSTRAINT "PurchaseDocument_metalTransferId_fkey" FOREIGN KEY ("metalTransferId") REFERENCES "PurchaseMetalTransfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseDocument" ADD CONSTRAINT "PurchaseDocument_purchaseReturnId_fkey" FOREIGN KEY ("purchaseReturnId") REFERENCES "PurchaseReturn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseDocument" ADD CONSTRAINT "PurchaseDocument_creditNoteId_fkey" FOREIGN KEY ("creditNoteId") REFERENCES "PurchaseCreditNote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseDocument" ADD CONSTRAINT "PurchaseDocument_debitNoteId_fkey" FOREIGN KEY ("debitNoteId") REFERENCES "PurchaseDebitNote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseDocument" ADD CONSTRAINT "PurchaseDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

