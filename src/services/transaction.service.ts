import { Transaction } from '@prisma/client';
import { Injectable } from '@tsed/di';
import { PrismaService } from './prisma-service';

@Injectable()
export class TransactionService {

  async getByExchangeId(exchangeId: number): Promise<Transaction[]> {
    return await PrismaService.getInstance().connection.transaction.findMany({
      where: {
        exchangeId
      }
    });
  }

  async saveTransactions(exchangeId: number, transactions: Transaction[]) {
    await this.deleteTransactionsForExchange(exchangeId);
    transactions.forEach(async (transaction: Transaction) => {
      await PrismaService.getInstance().connection.transaction.create({
        data: transaction
      });
    });
  }

  async deleteTransactionsForExchange(exchangeId: number) {
    return await PrismaService.getInstance().connection.transaction.deleteMany({
      where: {
        exchangeId
      }
    });
  }
}