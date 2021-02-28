-- CreateEnum
CREATE TYPE "ExchangeSyncStatus" AS ENUM ('NOT_SYNCED', 'SYNCING', 'SYNCED');

-- CreateEnum
CREATE TYPE "ExchangeName" AS ENUM ('COINBASEPRO', 'BITSTAMP', 'KRAKEN');

-- CreateTable
CREATE TABLE "Exchange" (
    "id" SERIAL NOT NULL,
    "name" "ExchangeName" NOT NULL DEFAULT E'COINBASEPRO',
    "apiKey" TEXT NOT NULL,
    "apiSecret" TEXT NOT NULL,
    "apiThird" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSync" TIMESTAMP(3),
    "syncStatus" "ExchangeSyncStatus" NOT NULL DEFAULT E'NOT_SYNCED',
    "userId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "salt" TEXT NOT NULL DEFAULT E'',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Exchange.apiKey_unique" ON "Exchange"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "Exchange.apiSecret_unique" ON "Exchange"("apiSecret");

-- CreateIndex
CREATE UNIQUE INDEX "Exchange.apiThird_unique" ON "Exchange"("apiThird");

-- CreateIndex
CREATE UNIQUE INDEX "User.email_unique" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Exchange" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
