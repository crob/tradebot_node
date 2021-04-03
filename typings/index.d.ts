import { Transaction } from '@prisma/client';

declare module 'trade_bot' {
  export type FinishExchangeSyncCallback = (userId, exchangeId, transactions: Transaction[]) => Promise<Transaction[]>;

  export type PortfolioSyncCallback = (userId, exchangeId, transactions?: Transaction[]) => Promise<any>;
}