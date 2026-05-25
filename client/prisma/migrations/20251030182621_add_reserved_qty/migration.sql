/*
  Warnings:

  - Made the column `weight` on table `StoneDetail` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ProductItem" ADD COLUMN     "reservedQty" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "StoneDetail" ALTER COLUMN "weight" SET NOT NULL,
ALTER COLUMN "weight" SET DEFAULT 0;
