import { Exchange, SyncStatus } from '@prisma/client';
import { Injectable } from '@tsed/di';
import { PrismaService } from './prisma-service';
import { ExchangeView } from '../models/views/exchange-view';
import { ExchangeWithTransactions } from '../models/exchange-with-transactions';

@Injectable()
export class ExchangeService {

  async getExchangeById(id: number): Promise<Exchange> {
    return await PrismaService.getInstance().connection.exchange.findUnique({
      where: {
        id
      }
    });
  }

  async getExchangesByUserId(userId: number, includeTransactions = false): Promise<ExchangeWithTransactions[]> {
    return await PrismaService.getInstance().connection.exchange.findMany({
      where: {
        userId
      },
      include: {
        transactions: includeTransactions
      }
    });
  }

  async removeExchange(id: number): Promise<Exchange> {
    await PrismaService.getInstance().connection.transaction.deleteMany({
      where: {
        exchangeId: id
      }
    });
    return await PrismaService.getInstance().connection.exchange.delete({
      where: {
        id
      }
    });
  }

  async setAllUserExchangesToSyncing(userId: number) {
    return await PrismaService.getInstance().connection.exchange.updateMany({
      where: {
        userId
      },
      data: {
        syncStatus: SyncStatus.SYNCING
      }
    });
  }

  async updateExchangeSyncStatus(id: number, syncStatus: SyncStatus): Promise<Exchange> {
    const data:Partial<Exchange> = {
      syncStatus
    };
    if (syncStatus === SyncStatus.SYNCED) {
      data.lastSyncAt = new Date();
    }
    return await PrismaService.getInstance().connection.exchange.update({
      where: {
        id
      },
      data
    });
  }

  async isExistingApiKey(userId: number, apiKey: string): Promise<Exchange>  {
    return await PrismaService.getInstance().connection.exchange.findFirst({
      where: {
        userId,
        apiKey
      }
    });
  }

  async createExchange(exchangeView: ExchangeView): Promise<Exchange> {
    const { name, apiKey, apiSecret, apiThird, userId } = {...exchangeView};
    return await PrismaService.getInstance().connection.exchange.create({
      data: {
        name,
        apiKey,
        apiSecret,
        apiThird,
        userId
      }
    });
  }
}