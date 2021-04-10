/*
  Warnings:

  - You are about to drop the column `transactionId` on the `TaxEvent` table. All the data in the column will be lost.
  - Added the required column `portfolioAssetId` to the `TaxEvent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SideType" ADD VALUE 'REWARD';
ALTER TYPE "SideType" ADD VALUE 'DEPOSIT';
ALTER TYPE "SideType" ADD VALUE 'WITHDRAWAL';

-- DropForeignKey
ALTER TABLE "TaxEvent" DROP CONSTRAINT "TaxEvent_transactionId_fkey";

-- AlterTable
ALTER TABLE "TaxEvent" DROP COLUMN "transactionId",
ADD COLUMN     "portfolioAssetId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Holding" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tradedAt" TIMESTAMP(3) NOT NULL,
    "coin" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "purchasePrice" DOUBLE PRECISION NOT NULL,
    "fees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "side" "SideType" NOT NULL DEFAULT E'BUY',
    "isManuallyAdded" BOOLEAN NOT NULL DEFAULT false,
    "portfolioAssetId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Holding" ADD FOREIGN KEY ("portfolioAssetId") REFERENCES "PortfolioAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxEvent" ADD FOREIGN KEY ("portfolioAssetId") REFERENCES "PortfolioAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
