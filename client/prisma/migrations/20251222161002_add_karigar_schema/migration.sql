-- CreateEnum
CREATE TYPE "LedgerType" AS ENUM ('ASSIGNED', 'RECEIVED', 'LOSS', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "KarigarDepartment" AS ENUM ('GOLD', 'SILVER', 'DIAMOND');

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_karigarId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "userId" INTEGER,
ALTER COLUMN "karigarId" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "Karigar" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "whatsappNumber" TEXT,
    "address" TEXT,
    "adharNumber" TEXT,
    "adharImage" TEXT,
    "panNumber" TEXT,
    "voterIdNumber" TEXT,
    "voterIdImage" TEXT,
    "department" "KarigarDepartment" NOT NULL,
    "speciality" TEXT[],
    "wastagePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "assignedMetal24k" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "receivedMetal92" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lossMetalOnHold" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentBalanceMetal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joiningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Karigar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KarigarLedger" (
    "id" TEXT NOT NULL,
    "karigarId" TEXT NOT NULL,
    "type" "LedgerType" NOT NULL,
    "metal24k" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KarigarLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Karigar_phoneNumber_key" ON "Karigar"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Karigar_adharNumber_key" ON "Karigar"("adharNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Karigar_panNumber_key" ON "Karigar"("panNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Karigar_voterIdNumber_key" ON "Karigar"("voterIdNumber");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_karigarId_fkey" FOREIGN KEY ("karigarId") REFERENCES "Karigar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KarigarLedger" ADD CONSTRAINT "KarigarLedger_karigarId_fkey" FOREIGN KEY ("karigarId") REFERENCES "Karigar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
