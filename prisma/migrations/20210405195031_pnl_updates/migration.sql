/*
  Warnings:

  - You are about to drop the column `isLongTerm` on the `TaxEvent` table. All the data in the column will be lost.
  - You are about to drop the column `pnl` on the `TaxEvent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PortfolioAsset" ADD COLUMN     "realizedPnL" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "TaxEvent" DROP COLUMN "isLongTerm",
DROP COLUMN "pnl",
ADD COLUMN     "spnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lpnl" DOUBLE PRECISION NOT NULL DEFAULT 0;
