/*
  Warnings:

  - You are about to drop the column `lastSync` on the `Exchange` table. All the data in the column will be lost.
  - You are about to drop the column `lastSync` on the `Portfolio` table. All the data in the column will be lost.
  - Added the required column `isManuallyAdded` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TaxEventType" AS ENUM ('LOSS', 'GAIN');

-- AlterTable
ALTER TABLE "Exchange" DROP COLUMN "lastSync",
ADD COLUMN     "lastSyncAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Portfolio" DROP COLUMN "lastSync",
ADD COLUMN     "lastSyncAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "isManuallyAdded" BOOLEAN NOT NULL;

-- CreateTable
CREATE TABLE "TaxEvent" (
    "id" SERIAL NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "taxedAt" TIMESTAMP(3) NOT NULL,
    "coin" TEXT NOT NULL,
    "isLongTerm" BOOLEAN NOT NULL,
    "type" "TaxEventType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TaxEvent" ADD FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
