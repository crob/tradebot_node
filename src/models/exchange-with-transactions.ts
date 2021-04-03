import { Exchange, Transaction } from '@prisma/client';

export interface ExchangeWithTransactions extends Exchange {
  transactions?: Transaction[];
}
