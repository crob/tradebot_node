/*
  Warnings:

  - The migration will add a unique constraint covering the columns `[transactionId]` on the table `TaxEvent`. If there are existing duplicate values, the migration will fail.
  - Added the required column `transactionId` to the `TaxEvent` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TaxStrategy" AS ENUM ('FirstInFirstOut', 'FirstInLastOut', 'LastInFirstOut', 'PrioritizeLongTerm');

-- AlterTable
ALTER TABLE "TaxEvent" ADD COLUMN     "transactionId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "taxStrategy" "TaxStrategy" NOT NULL DEFAULT E'PrioritizeLongTerm';

-- CreateIndex
CREATE UNIQUE INDEX "TaxEvent_transactionId_unique" ON "TaxEvent"("transactionId");

-- AddForeignKey
ALTER TABLE "TaxEvent" ADD FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
