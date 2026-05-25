/*
  Warnings:

  - Added the required column `customerId` to the `MetalExchangeItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MetalExchangeItem" ADD COLUMN     "customerId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "MetalExchangeItem" ADD CONSTRAINT "MetalExchangeItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
