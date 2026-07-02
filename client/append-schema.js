const fs = require('fs');
const path = require('path');

const newSchemaContent = `
// ===========================
// RATE LOCK PLANS (Config)
// ===========================
model RateLockPlan {
  id                  String    @id @default(cuid())
  name                String    // e.g. "Standard Lock", "15-Day Lock"
  lockDurationDays    Int       // e.g. 90, 15
  minAdvancePercent   Float     // e.g. 30.0 (minimum to book)
  rateLockPercent     Float     // e.g. 80.0 (advance % required to fully lock rate)
  partialLockPercent  Float     // e.g. 50.0 (advance % for partial lock)
  cancellationCharge  Float     @default(2.0) // % deducted on refund
  isActive            Boolean   @default(true)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  bookings            ProductBooking[]
}

// ===========================
// CORE BOOKING MODEL
// ===========================
model ProductBooking {
  id                  String          @id @default(cuid())
  bookingNumber       String          @unique  // BKG-YYYYMM-XXXX

  // Relations
  customerId          Int
  customer            Customer        @relation(fields: [customerId], references: [id])
  productId           Int
  product             ProductItem     @relation(fields: [productId], references: [id])
  branchId            Int
  branch              Branch          @relation(fields: [branchId], references: [id])
  createdById         Int?
  createdBy           User?           @relation("BookingCreatedBy", fields: [createdById], references: [id])
  rateLockPlanId      String?
  rateLockPlan        RateLockPlan?   @relation(fields: [rateLockPlanId], references: [id])

  // Rate & Value
  bookingGoldRate     Float           // gold rate at time of booking (per gram, 22K)
  bookingValue        Float           // total booking value in ₹
  productWeight       Float           // copied from ProductItem.gsWeight at booking time
  productPurity       Float           // copied from ProductItem.purity

  // Rate Lock State
  rateLockStatus      RateLockStatus  @default(NO_LOCK)
  lockedRate          Float?          // rate at which lock was applied
  lockedAt            DateTime?
  lockedPortion       Float?          // ₹ portion at locked rate
  lockedWeightGrams   Float?          // grams locked

  // Delivery Plan
  deliveryRatePlan    DeliveryRatePlan @default(SPLIT)

  // Advance Tracking
  totalCashAdvance    Float           @default(0)
  totalMetalAdvance   Float           @default(0)  // in ₹ equivalent
  totalWalletUsed     Float           @default(0)
  totalAdvance        Float           @default(0)  // sum of all above
  advancePercent      Float           @default(0)  // totalAdvance / bookingValue * 100

  // Dates
  bookingDate         DateTime        @default(now())
  expiryDate          DateTime        // bookingDate + lockDurationDays
  deliveryDueDate     DateTime?
  deliveredAt         DateTime?

  // Status
  status              BookingStatus   @default(ACTIVE)
  cancellationReason  String?
  cancelledAt         DateTime?
  cancelledById       Int?

  // Transfer
  originalBranchId    Int?            // set if transferred

  // Relations
  advances            BookingAdvance[]
  ledger              BookingLedger[]
  deliverySessions    DeliverySession[]
  transfers           BookingTransfer[]
  auditLogs           BookingAuditLog[]

  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  @@index([customerId])
  @@index([productId])
  @@index([branchId])
  @@index([status])
  @@index([expiryDate])
  @@index([bookingDate])
  @@index([bookingNumber])
}

// ===========================
// BOOKING ADVANCES
// ===========================
model BookingAdvance {
  id                  String          @id @default(cuid())
  bookingId           String
  booking             ProductBooking  @relation(fields: [bookingId], references: [id])
  
  advanceType         AdvanceType     // CASH | UPI | CARD | BANK_TRANSFER | WALLET | METAL_22K | METAL_24K
  
  // For cash/digital
  cashAmount          Float           @default(0)
  paymentRef          String?         // UPI ref, UTR, etc.
  
  // For metal advance
  metalWeight         Float?          // grams
  metalPurity         String?         // "22K" or "24K"
  metalRateApplied    Float?          // rate per gram at time of entry
  metalValueInRupees  Float?          // metalWeight * metalRateApplied
  
  // Net advance value (cash + metal value)
  netValue            Float           // actual ₹ contribution to totalAdvance

  branchId            Int
  branch              Branch          @relation(fields: [branchId], references: [id])
  receivedById        Int?
  receivedBy          User?           @relation("AdvanceReceivedBy", fields: [receivedById], references: [id])

  createdAt           DateTime        @default(now())

  @@index([bookingId])
  @@index([branchId])
  @@index([createdAt])
}

// ===========================
// BOOKING LEDGER (Full History)
// ===========================
model BookingLedger {
  id                  String          @id @default(cuid())
  bookingId           String
  booking             ProductBooking  @relation(fields: [bookingId], references: [id])
  
  entryType           BookingLedgerEntryType
  description         String
  amount              Float           @default(0)   // positive = credit, negative = debit
  balanceAfter        Float           @default(0)   // running balance
  
  performedById       Int?
  performedBy         User?           @relation("LedgerPerformedBy", fields: [performedById], references: [id])
  
  metadata            Json?           // store advance id, transfer id, etc.
  
  createdAt           DateTime        @default(now())

  @@index([bookingId])
  @@index([createdAt])
}

// ===========================
// DELIVERY SESSION
// ===========================
model DeliverySession {
  id                  String          @id @default(cuid())
  bookingId           String
  booking             ProductBooking  @relation(fields: [bookingId], references: [id])
  
  deliveryType        DeliveryType    @default(FULL)  // FULL | PARTIAL
  
  // Settlement breakdown
  lockedPortionValue  Float           @default(0)  // at locked rate
  deliveryRateValue   Float           @default(0)  // at delivery rate
  walletAmountUsed    Float           @default(0)
  advancePaid         Float           @default(0)
  outstandingAmount   Float           @default(0)  // what was collected at delivery
  
  deliveryGoldRate    Float           // gold rate at delivery time
  
  paymentMethod       PaymentMethod?
  paymentRef          String?
  
  performedById       Int?
  performedBy         User?           @relation("DeliveryPerformedBy", fields: [performedById], references: [id])
  
  notes               String?
  createdAt           DateTime        @default(now())

  @@index([bookingId])
}

// ===========================
// BRANCH TRANSFER
// ===========================
model BookingTransfer {
  id                  String          @id @default(cuid())
  bookingId           String
  booking             ProductBooking  @relation(fields: [bookingId], references: [id])
  
  fromBranchId        Int
  fromBranch          Branch          @relation("TransferFromBranch", fields: [fromBranchId], references: [id])
  toBranchId          Int
  toBranch            Branch          @relation("TransferToBranch", fields: [toBranchId], references: [id])
  
  reason              String
  notes               String?
  status              TransferStatus  @default(PENDING)  // PENDING | COMPLETED
  
  initiatedById       Int?
  initiatedBy         User?           @relation("TransferInitiatedBy", fields: [initiatedById], references: [id])
  
  completedAt         DateTime?
  createdAt           DateTime        @default(now())

  @@index([bookingId])
}

// ===========================
// AUDIT LOG
// ===========================
model BookingAuditLog {
  id                  String          @id @default(cuid())
  bookingId           String
  booking             ProductBooking  @relation(fields: [bookingId], references: [id])
  
  action              String          // CREATED, ADVANCE_ADDED, RATE_LOCKED, STATUS_CHANGED, TRANSFER, DELIVERED, CANCELLED
  changedById         Int?
  changedBy           User?           @relation("AuditChangedBy", fields: [changedById], references: [id])
  
  previousValue       Json?           // before state (key fields only)
  newValue            Json?           // after state
  
  ipAddress           String?
  userAgent           String?
  
  createdAt           DateTime        @default(now())

  @@index([bookingId])
  @@index([createdAt])
}

// ===========================
// ENUMS
// ===========================

enum BookingStatus {
  ACTIVE
  RATE_LOCKED
  PARTIAL_LOCK
  DELIVERY_PENDING
  DELIVERED
  CANCELLED
  EXPIRED
}

enum RateLockStatus {
  NO_LOCK
  PARTIAL_LOCK
  FULL_LOCK
}

enum AdvanceType {
  CASH
  UPI
  CARD
  BANK_TRANSFER
  WALLET
  METAL_22K
  METAL_24K
}

enum DeliveryRatePlan {
  LOCK_NOW
  SPLIT
  MARKET_RATE
}

enum BookingLedgerEntryType {
  BOOKING_CREATED
  ADVANCE_ADDED
  WALLET_USED
  RATE_LOCKED
  DELIVERY_PARTIAL
  DELIVERY_COMPLETE
  CANCELLATION
  REFUND_WALLET
  REFUND_CASH
  EXPIRY_EXTENDED
  TRANSFER
}

enum DeliveryType {
  FULL
  PARTIAL
}

enum TransferStatus {
  PENDING
  COMPLETED
  REJECTED
}
`;

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
fs.appendFileSync(schemaPath, newSchemaContent);
console.log('Appended to schema.prisma successfully');
