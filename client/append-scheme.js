const fs = require('fs');
const code = `
enum SavingSchemeType {
  FIXED_MONTHLY
  ANONYMOUS_DEPOSIT
  GOLD_DEPOSIT
}

enum SchemeStatus {
  ACTIVE
  MATURED
  REDEEMED
  PARTIALLY_REDEEMED
  CANCELLED
  EXPIRED
}

enum SchemeDepositType {
  CASH
  GOLD
  SILVER
  OTHER_METAL
  BONUS
}

model SavingScheme {
  id                   String             @id @default(cuid())
  schemeNumber          String             @unique
  type                 SavingSchemeType
  status               SchemeStatus       @default(ACTIVE)
  customerId           Int
  customer             Customer           @relation(fields: [customerId], references: [id])
  branchId             Int
  branch               Branch             @relation(fields: [branchId], references: [id])
  createdById          Int?
  createdBy            User?              @relation(fields: [createdById], references: [id])
  fixedMonthlyAmount   Float?
  maxDurationMonths    Int                @default(12)
  startDate            DateTime           @default(now())
  maturityDate         DateTime?
  totalCashDeposited   Float              @default(0)
  totalGoldDepositedGm Float              @default(0)
  totalBonusAmount     Float              @default(0)
  depositCount         Int                @default(0)
  totalRedeemed        Float              @default(0)
  redeemedInvoiceIds   String?
  physicalCardNumber   String?            @unique
  cardIssuedAt         DateTime?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt
  deposits             SchemeDeposit[]
  redemptions          SchemeRedemption[]

  @@index([customerId])
  @@index([branchId])
  @@index([status])
  @@index([schemeNumber])
}

model SchemeDeposit {
  id              String            @id @default(cuid())
  schemeId        String
  scheme          SavingScheme      @relation(fields: [schemeId], references: [id], onDelete: Cascade)
  depositType     SchemeDepositType
  cashAmount      Float?
  metalWeightGm   Float?
  metalPurity     Float?
  metalType       String?
  metalRatePerGm  Float?
  monthNumber     Int?
  isBonus         Boolean           @default(false)
  remarks         String?
  receiptNumber   String?           @unique
  depositedAt     DateTime          @default(now())
  recordedById    Int?

  @@index([schemeId])
  @@index([depositedAt])
}

model SchemeRedemption {
  id              String       @id @default(cuid())
  schemeId        String
  scheme          SavingScheme @relation(fields: [schemeId], references: [id], onDelete: Cascade)
  invoiceId       Int?
  amountUsed      Float
  goldWeightUsed  Float?
  redeemedAt      DateTime     @default(now())
  remarks         String?

  @@index([schemeId])
  @@index([invoiceId])
}
`;

fs.appendFileSync('prisma/schema.prisma', code);
console.log('Done!');
