-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('NOT_SYNCED', 'SYNCING', 'SYNCED');

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
    "syncStatus" "SyncStatus" NOT NULL DEFAULT E'NOT_SYNCED',
    "userId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioAsset" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "coin" TEXT NOT NULL,
    "coinName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "averagePrice" DOUBLE PRECISION NOT NULL,
    "portfolioId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSync" TIMESTAMP(3),
    "syncStatus" "SyncStatus" NOT NULL DEFAULT E'NOT_SYNCED',
    "userId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "exchangeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "sellDate" TIMESTAMP(3),
    "coin" TEXT NOT NULL,
    "coinName" TEXT NOT NULL,
    "purchasePrice" DOUBLE PRECISION NOT NULL,
    "sellPrice" DOUBLE PRECISION,
    "amount" DOUBLE PRECISION NOT NULL,
    "shortTermRealizedGains" DOUBLE PRECISION,
    "longTermRealizedGains" DOUBLE PRECISION,
    "shortTermUnrealizedGains" DOUBLE PRECISION,
    "longTermUnrealizedGains" DOUBLE PRECISION,

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
CREATE UNIQUE INDEX "Portfolio_userId_unique" ON "Portfolio"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User.email_unique" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Exchange" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioAsset" ADD FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Portfolio" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD FOREIGN KEY ("exchangeId") REFERENCES "Exchange"("id") ON DELETE CASCADE ON UPDATE CASCADE;
