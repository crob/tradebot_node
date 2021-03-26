import * as KrakenClient from 'kraken-api';
import { BaseExchangeClient } from './base-exchange-service';
import { KrakenApi } from '../../enums';
import { AccountBalance } from '../../models/account-balance';
import { ExchangeName } from '@prisma/client';
import { TaskQueueService } from '../task-queue.service';

export class KrakenService extends BaseExchangeClient {
  client: KrakenClient;
  type = ExchangeName.KRAKEN

  constructor(protected taskQueueService: TaskQueueService) {
    super(taskQueueService);
  }

  connect(key: string, secret: string) {
    this.key = key;
    this.secret = secret;
    this.handleConnection();
  }

  protected handleConnection() {
    try {
      this.client = new KrakenClient(this.key, this.secret);
      this.isUp = true;
    } catch(e) {
      throw new Error("Kraken Client is not up");
    }
  }

  async getTradablePairs() {
    return await this.getClient().api(KrakenApi.AssetPairs)
  }

  setTrade() {
    return this.getClient().api(KrakenApi.AssetPairs)
  }

  async getTransactions(userId: number, exchangeId: number) {
    return null;
  }

  async getBalance(): Promise<AccountBalance[]> {
    const accounts = [];
    try {
      const response = await this.getClient().api(KrakenApi.Balance);
      if (response.result) {
        for (const key in response.result) {
          if (response.result.hasOwnProperty(key)) {
            const balance = parseFloat(response.result[key]);
            if (balance > 0) {
              accounts.push({
                ticker: key,
                balance
              });
            }
          }
        }
      }
    } catch(e) {
      throw new Error(e);
    }
    return accounts;
  }

  disconnect() {
    return null;
  }
}