/*
  Warnings:

  - You are about to drop the column `receivedMetal92` on the `Karigar` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Karigar" DROP COLUMN "receivedMetal92",
ADD COLUMN     "receivedMetal14k" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "receivedMetal18k" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "receivedMetal20k" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "receivedMetal22k" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "salaryInGold" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "salaryInMoney" DOUBLE PRECISION NOT NULL DEFAULT 0;
