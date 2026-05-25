/*
  Warnings:

  - You are about to drop the column `phone` on the `Order` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MetalType" AS ENUM ('GOLD', 'SILVER');

-- CreateEnum
CREATE TYPE "MetalExchangeStatus" AS ENUM ('PENDING', 'PROCESSING', 'TONCHED');

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "phone";

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
    "netFineGold" DOUBLE PRECISION NOT NULL DEFAULT 0,
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

-- CreateIndex
CREATE UNIQUE INDEX "MetalExchangeSession_sessionNumber_key" ON "MetalExchangeSession"("sessionNumber");

-- AddForeignKey
ALTER TABLE "MetalExchangeSession" ADD CONSTRAINT "MetalExchangeSession_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalExchangeSession" ADD CONSTRAINT "MetalExchangeSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalExchangeSession" ADD CONSTRAINT "MetalExchangeSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalExchangeItem" ADD CONSTRAINT "MetalExchangeItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MetalExchangeSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalExchangeAudit" ADD CONSTRAINT "MetalExchangeAudit_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MetalExchangeSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetalExchangeAudit" ADD CONSTRAINT "MetalExchangeAudit_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
