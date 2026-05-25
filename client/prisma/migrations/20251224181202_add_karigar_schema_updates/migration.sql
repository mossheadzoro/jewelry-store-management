/*
  Warnings:

  - You are about to drop the column `assignedMetal24k` on the `Karigar` table. All the data in the column will be lost.
  - You are about to drop the column `currentBalanceMetal` on the `Karigar` table. All the data in the column will be lost.
  - You are about to drop the column `lossMetalOnHold` on the `Karigar` table. All the data in the column will be lost.
  - You are about to drop the column `receivedMetal14k` on the `Karigar` table. All the data in the column will be lost.
  - You are about to drop the column `receivedMetal18k` on the `Karigar` table. All the data in the column will be lost.
  - You are about to drop the column `receivedMetal20k` on the `Karigar` table. All the data in the column will be lost.
  - You are about to drop the column `receivedMetal22k` on the `Karigar` table. All the data in the column will be lost.
  - You are about to drop the column `salaryInGold` on the `Karigar` table. All the data in the column will be lost.
  - You are about to drop the column `metal24k` on the `KarigarLedger` table. All the data in the column will be lost.
  - Added the required column `fineGold` to the `KarigarLedger` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MetalReturnType" AS ENUM ('JEWELLERY', 'SALARY', 'DUST', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "Karigar" DROP COLUMN "assignedMetal24k",
DROP COLUMN "currentBalanceMetal",
DROP COLUMN "lossMetalOnHold",
DROP COLUMN "receivedMetal14k",
DROP COLUMN "receivedMetal18k",
DROP COLUMN "receivedMetal20k",
DROP COLUMN "receivedMetal22k",
DROP COLUMN "salaryInGold",
ADD COLUMN     "assignedFineGold" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "currentFineGoldBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "finalLossFineGold" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lossFineGoldOnHold" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "receivedFineGold" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "salaryFineGold" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "KarigarLedger" DROP COLUMN "metal24k",
ADD COLUMN     "fineGold" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "referenceId" TEXT;

-- CreateTable
CREATE TABLE "KarigarMetalJob" (
    "id" TEXT NOT NULL,
    "karigarId" TEXT NOT NULL,
    "issuedWeight" DOUBLE PRECISION NOT NULL,
    "issuedPurity" DOUBLE PRECISION NOT NULL,
    "issuedFineGold" DOUBLE PRECISION NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'OPEN',
    "lossFineGoldOnHold" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalLossFineGold" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "KarigarMetalJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KarigarMetalReturn" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "returnedWeight" DOUBLE PRECISION NOT NULL,
    "displayPurity" TEXT NOT NULL,
    "accountingPurity" DOUBLE PRECISION NOT NULL,
    "returnedFineGold" DOUBLE PRECISION NOT NULL,
    "type" "MetalReturnType" NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KarigarMetalReturn_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KarigarMetalJob" ADD CONSTRAINT "KarigarMetalJob_karigarId_fkey" FOREIGN KEY ("karigarId") REFERENCES "Karigar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KarigarMetalReturn" ADD CONSTRAINT "KarigarMetalReturn_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "KarigarMetalJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
