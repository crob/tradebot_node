import { Exchange, SyncStatus } from '@prisma/client';
import { Injectable } from '@tsed/di';
import crypto from 'crypto';
import dotenv from 'dotenv';

import { PrismaService } from './prisma-service';
import { ExchangeView } from '../models/views/exchange-view';
import { ExchangeWithTransactions } from '../models/exchange-with-transactions';
import { $log } from '@tsed/logger';

@Injectable()
export class ExchangeService {


  encryptApiSecret(passedApiSecret: string): {apiSecret: string, salt: string} {
    const salt = crypto.randomBytes(16).toString('hex').slice(0, 16)
    const cipher = crypto.createCipheriv(process.env.ENCRYPTION_ALGORITHM, process.env.ENCRYPTION_SECRET, salt);
    const apiSecret = cipher.update(passedApiSecret, 'utf8', 'hex') + cipher.final('hex');
    return {apiSecret, salt};
  }

  decryptApiSecret(apiSecret: string, salt: string): string {
    const decipher = crypto.createDecipheriv(process.env.ENCRYPTION_ALGORITHM, process.env.ENCRYPTION_SECRET, salt);
    return decipher.update(apiSecret, 'hex', 'utf8') + decipher.final('utf8');
  }

  async getExchangeById(id: number): Promise<Exchange> {
    const exchange = await PrismaService.getInstance().connection.exchange.findUnique({
      where: {
        id
      }
    });
    exchange.apiSecret = this.decryptApiSecret(exchange.apiSecret, exchange.salt);
    return exchange;
  }

  async getExchangesByUserId(userId: number, includeTransactions = false): Promise<ExchangeWithTransactions[]> {
    const exchanges = await PrismaService.getInstance().connection.exchange.findMany({
      where: {
        userId
      },
      include: {
        transactions: includeTransactions
      }
    });
    exchanges.map((exchange: Exchange) => exchange.apiSecret = this.decryptApiSecret(exchange.apiSecret, exchange.salt));
    return exchanges;
  }

  removeSensativeExchangeInfo(exchange: Exchange): Exchange {
    delete exchange.apiSecret;
    delete exchange.salt;
    delete exchange.apiKey;
    delete exchange.apiThird;
    return exchange;
  }

  async getExchangesViewModelByUserId(userId: number, includeTransactions = false): Promise<ExchangeWithTransactions[]> {
    const exchanges = await this.getExchangesByUserId(userId, includeTransactions);
    return exchanges.map(this.removeSensativeExchangeInfo);
  }

  async removeExchange(id: number): Promise<Exchange> {
    try {

      await PrismaService.getInstance().connection.transaction.deleteMany({
        where: {
          exchangeId: id
        }
      });
    } catch(e) {
      $log.error(e)
    }
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

  async updateExchangeSyncStatus(id: number, syncStatus: SyncStatus, lastOffset: number = null): Promise<Exchange> {
    const data:Partial<Exchange> = {
      syncStatus,
      lastOffset
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
    const newExchange = await PrismaService.getInstance().connection.exchange.create({
      data: {
        ...exchangeView,
        ...this.encryptApiSecret(exchangeView.apiSecret)
      }
    });
    newExchange.apiSecret = this.decryptApiSecret(newExchange.apiSecret, newExchange.salt);
    return newExchange;
  }
}