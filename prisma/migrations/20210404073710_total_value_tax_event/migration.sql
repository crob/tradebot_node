/*
  Warnings:

  - Added the required column `totalValue` to the `TaxEvent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TaxEvent" ADD COLUMN     "totalValue" DOUBLE PRECISION NOT NULL;
