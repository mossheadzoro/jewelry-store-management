/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Branch` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Branch` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[aadharNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `address` to the `Branch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `Branch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Branch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `Branch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pincode` to the `Branch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `Branch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Branch` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'CARD', 'CHEQUE', 'NEFT', 'RTGS', 'WALLET', 'OTHER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'India',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "pincode" TEXT NOT NULL,
ADD COLUMN     "state" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "aadharNumber" TEXT,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "bankAccount" TEXT,
ADD COLUMN     "commissionRate" DOUBLE PRECISION,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "ifscCode" TEXT,
ADD COLUMN     "isCommissionBased" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastSaleDate" TIMESTAMP(3),
ADD COLUMN     "panNumber" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "salary" DOUBLE PRECISION,
ADD COLUMN     "totalSales" DOUBLE PRECISION DEFAULT 0;

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "branchId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branchId" INTEGER NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branchId" INTEGER NOT NULL,

    CONSTRAINT "SubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "huidNumber" TEXT NOT NULL,
    "gsWeight" DOUBLE PRECISION NOT NULL,
    "ntWeight" DOUBLE PRECISION NOT NULL,
    "purity" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "image" TEXT,
    "description" TEXT,
    "branchId" INTEGER NOT NULL,
    "subCategoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoneDetail" (
    "id" SERIAL NOT NULL,
    "carat" DOUBLE PRECISION,
    "color" TEXT,
    "colorGrade" TEXT,
    "clarity" TEXT,
    "cut" TEXT,
    "shape" TEXT,
    "origin" TEXT,
    "treatment" TEXT,
    "certification" TEXT,
    "quality" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stoneImageUrl" TEXT,
    "certImageUrl" TEXT,
    "productItemId" INTEGER NOT NULL,

    CONSTRAINT "StoneDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "pan" TEXT,
    "gstin" TEXT,
    "aadhar" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "dob" TIMESTAMP(3),
    "anniversary" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" SERIAL NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "createdById" INTEGER,
    "totalMetalAmount" DOUBLE PRECISION NOT NULL,
    "totalMakingAmount" DOUBLE PRECISION NOT NULL,
    "totalStoneAmount" DOUBLE PRECISION NOT NULL,
    "discountOnMaking" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxOnGold" DOUBLE PRECISION NOT NULL,
    "taxOnMaking" DOUBLE PRECISION NOT NULL,
    "taxOnHallmarking" DOUBLE PRECISION NOT NULL,
    "hallmarkingCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cgst" DOUBLE PRECISION NOT NULL,
    "sgst" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL,
    "balanceAmount" DOUBLE PRECISION NOT NULL,
    "isFullyPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "gsWeight" DOUBLE PRECISION NOT NULL,
    "ntWeight" DOUBLE PRECISION NOT NULL,
    "metalRate" DOUBLE PRECISION NOT NULL,
    "metalValue" DOUBLE PRECISION NOT NULL,
    "makingPercent" DOUBLE PRECISION NOT NULL,
    "makingAmount" DOUBLE PRECISION NOT NULL,
    "stoneCharge" DOUBLE PRECISION NOT NULL,
    "discountOnMaking" DOUBLE PRECISION NOT NULL,
    "totalBeforeTax" DOUBLE PRECISION NOT NULL,
    "cgst" DOUBLE PRECISION NOT NULL,
    "sgst" DOUBLE PRECISION NOT NULL,
    "totalAfterTax" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoicePayment" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentRef" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoicePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_branchId_key" ON "Category"("name", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductItem_barcode_key" ON "ProductItem"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "ProductItem_productCode_key" ON "ProductItem"("productCode");

-- CreateIndex
CREATE UNIQUE INDEX "ProductItem_huidNumber_key" ON "ProductItem"("huidNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_mobile_key" ON "Customer"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_pan_key" ON "Customer"("pan");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_gstin_key" ON "Customer"("gstin");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_aadhar_key" ON "Customer"("aadhar");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_name_key" ON "Branch"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_email_key" ON "Branch"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_aadharNumber_key" ON "User"("aadharNumber");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubCategory" ADD CONSTRAINT "SubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubCategory" ADD CONSTRAINT "SubCategory_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductItem" ADD CONSTRAINT "ProductItem_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductItem" ADD CONSTRAINT "ProductItem_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoneDetail" ADD CONSTRAINT "StoneDetail_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES "ProductItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
