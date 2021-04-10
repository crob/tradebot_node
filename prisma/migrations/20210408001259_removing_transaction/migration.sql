-- DropForeignKey
ALTER TABLE "TaxEvent" DROP CONSTRAINT "TaxEvent_transactionId_fkey";

-- DropIndex
DROP INDEX "TaxEvent_transactionId_unique";

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "taxEventId" INTEGER;

-- AddForeignKey
ALTER TABLE "Transaction" ADD FOREIGN KEY ("taxEventId") REFERENCES "TaxEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
