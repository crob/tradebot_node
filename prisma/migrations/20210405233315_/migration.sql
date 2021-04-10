/*
  Warnings:

  - You are about to drop the column `realizedPnL` on the `PortfolioAsset` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PortfolioAsset" DROP COLUMN "realizedPnL",
ADD COLUMN     "realizedPnLShort" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "realizedPnLLong" DOUBLE PRECISION NOT NULL DEFAULT 0;
