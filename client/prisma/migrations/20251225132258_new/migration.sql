/*
  Warnings:

  - You are about to drop the column `adharImage` on the `Karigar` table. All the data in the column will be lost.
  - You are about to drop the column `assignedFineGold` on the `Karigar` table. All the data in the column will be lost.
  - You are about to drop the column `currentFineGoldBalance` on the `Karigar` table. All the data in the column will be lost.
  - You are about to drop the column `finalLossFineGold` on the `Karigar` table. All the data in the column will be lost.
  - You are about to drop the column `lossFineGoldOnHold` on the `Karigar` table. All the data in the column will be lost.
  - You are about to drop the column `receivedFineGold` on the `Karigar` table. All the data in the column will be lost.
  - You are about to drop the column `salaryFineGold` on the `Karigar` table. All the data in the column will be lost.
  - You are about to drop the column `salaryInMoney` on the `Karigar` table. All the data in the column will be lost.
  - You are about to drop the column `voterIdImage` on the `Karigar` table. All the data in the column will be lost.
  - You are about to drop the column `voterIdNumber` on the `Karigar` table. All the data in the column will be lost.
  - You are about to drop the column `wastagePercent` on the `Karigar` table. All the data in the column will be lost.
  - You are about to drop the `KarigarLedger` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `KarigarMetalJob` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `KarigarMetalReturn` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "RemainingAction" AS ENUM ('HOLD', 'RETURN');

-- CreateEnum
CREATE TYPE "JewelleryPurity" AS ENUM ('K22', 'K20', 'K18', 'K14');

-- DropForeignKey
ALTER TABLE "KarigarLedger" DROP CONSTRAINT "KarigarLedger_karigarId_fkey";

-- DropForeignKey
ALTER TABLE "KarigarMetalJob" DROP CONSTRAINT "KarigarMetalJob_karigarId_fkey";

-- DropForeignKey
ALTER TABLE "KarigarMetalReturn" DROP CONSTRAINT "KarigarMetalReturn_jobId_fkey";

-- DropIndex
DROP INDEX "Karigar_adharNumber_key";

-- DropIndex
DROP INDEX "Karigar_panNumber_key";

-- DropIndex
DROP INDEX "Karigar_voterIdNumber_key";

-- AlterTable
ALTER TABLE "Karigar" DROP COLUMN "adharImage",
DROP COLUMN "assignedFineGold",
DROP COLUMN "currentFineGoldBalance",
DROP COLUMN "finalLossFineGold",
DROP COLUMN "lossFineGoldOnHold",
DROP COLUMN "receivedFineGold",
DROP COLUMN "salaryFineGold",
DROP COLUMN "salaryInMoney",
DROP COLUMN "voterIdImage",
DROP COLUMN "voterIdNumber",
DROP COLUMN "wastagePercent";

-- DropTable
DROP TABLE "KarigarLedger";

-- DropTable
DROP TABLE "KarigarMetalJob";

-- DropTable
DROP TABLE "KarigarMetalReturn";

-- DropEnum
DROP TYPE "LedgerType";

-- DropEnum
DROP TYPE "MetalReturnType";

-- CreateTable
CREATE TABLE "KarigarJob" (
    "id" TEXT NOT NULL,
    "karigarId" TEXT NOT NULL,
    "issuedWeight" DOUBLE PRECISION NOT NULL,
    "issuedPurity" DOUBLE PRECISION NOT NULL,
    "wastagePercent" DOUBLE PRECISION,
    "fineUsed" DOUBLE PRECISION,
    "fineWastage" DOUBLE PRECISION,
    "remainingRawMetal" DOUBLE PRECISION,
    "remainingAction" "RemainingAction",
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

-- AddForeignKey
ALTER TABLE "KarigarJob" ADD CONSTRAINT "KarigarJob_karigarId_fkey" FOREIGN KEY ("karigarId") REFERENCES "Karigar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KarigarJobJewellery" ADD CONSTRAINT "KarigarJobJewellery_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "KarigarJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
