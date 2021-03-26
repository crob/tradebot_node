/*
  Warnings:

  - You are about to drop the column `purchaseDate` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `sellDate` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `sellPrice` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `shortTermRealizedGains` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `longTermRealizedGains` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `shortTermUnrealizedGains` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `longTermUnrealizedGains` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `openedAt` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `doneAt` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `post` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `settled` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `filled` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('LIMIT', 'MARKET', 'STOP', 'STOPLOSS');

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "purchaseDate",
DROP COLUMN "sellDate",
DROP COLUMN "sellPrice",
DROP COLUMN "shortTermRealizedGains",
DROP COLUMN "longTermRealizedGains",
DROP COLUMN "shortTermUnrealizedGains",
DROP COLUMN "longTermUnrealizedGains",
ADD COLUMN     "openedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "doneAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "fees" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "type" "OrderType" NOT NULL,
ADD COLUMN     "post" BOOLEAN NOT NULL,
ADD COLUMN     "settled" BOOLEAN NOT NULL,
ADD COLUMN     "filled" BOOLEAN NOT NULL;
