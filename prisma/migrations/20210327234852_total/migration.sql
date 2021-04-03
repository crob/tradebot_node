/*
  Warnings:

  - Added the required column `total` to the `PortfolioAsset` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PortfolioAsset" ADD COLUMN     "total" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "coinName" DROP NOT NULL;
