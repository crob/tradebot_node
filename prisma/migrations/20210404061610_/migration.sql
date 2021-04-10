/*
  Warnings:

  - You are about to drop the column `total` on the `PortfolioAsset` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PortfolioAsset" DROP COLUMN "total",
ADD COLUMN     "totalInvested" DOUBLE PRECISION NOT NULL DEFAULT 0;
