-- CreateEnum
CREATE TYPE "SideType" AS ENUM ('BUY', 'SELL');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "side" "SideType" NOT NULL DEFAULT E'BUY';
