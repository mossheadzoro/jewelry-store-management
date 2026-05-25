/*
  Warnings:

  - You are about to drop the column `netFineGold` on the `MetalExchangeSession` table. All the data in the column will be lost.
  - Added the required column `fineGold` to the `MetalExchangeSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fineSilver` to the `MetalExchangeSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MetalExchangeSession" DROP COLUMN "netFineGold",
ADD COLUMN     "fineGold" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "fineSilver" DOUBLE PRECISION NOT NULL;
