import { Exchange, ExchangeName, SyncStatus, Transaction } from '@prisma/client';
import { Injectable } from '@tsed/di';
import { PrismaService } from './prisma-service';
import { ExchangeView } from '../models/views/exchange-view';
import { ExchangeClientFactoryService } from './exchange-apis';

@Injectable()
export class ExchangeService {

  constructor(private readonly exchangeClientFactoryService: ExchangeClientFactoryService) {

  }

  async getExchangeById(id: number): Promise<Exchange> {
    return await PrismaService.getInstance().connection.exchange.findUnique({
      where: {
        id
      }
    });
  }

  async getExchangesByUserId(userId: number): Promise<Exchange[]> {
    return await PrismaService.getInstance().connection.exchange.findMany({
      where: {
        userId
      }
    });
  }

  async removeExchange(id: number): Promise<Exchange> {
    return await PrismaService.getInstance().connection.exchange.delete({
      where: {
        id
      }
    });
  }

  async updateExchangeSyncStatus(id: number, syncStatus: SyncStatus): Promise<Exchange> {
    const data:Partial<Exchange> = {
      syncStatus
    };
    if (syncStatus === SyncStatus.SYNCED) {
      data.lastSync = new Date();
    }
    return await PrismaService.getInstance().connection.exchange.update({
      where: {
        id
      },
      data
    });
  }

  async fetchTransactionsForSync(userId: number, exchangeId: number, exchangeName: ExchangeName): Promise<boolean> {
    const exchangeClient = this.exchangeClientFactoryService.getClientByType(userId, exchangeName);
    return await exchangeClient.getTransactions(userId, exchangeId);
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