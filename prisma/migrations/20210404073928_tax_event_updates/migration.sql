/*
  Warnings:

  - Added the required column `salePrice` to the `TaxEvent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pnl` to the `TaxEvent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TaxEvent" ADD COLUMN     "salePrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "pnl" DOUBLE PRECISION NOT NULL;
