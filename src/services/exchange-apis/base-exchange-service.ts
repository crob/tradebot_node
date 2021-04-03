import { ExchangeName, Transaction } from '@prisma/client';
import { TaskQueueService } from '../task-queue.service';

import { FinishExchangeSyncCallback } from 'trade_bot';
import { Account } from 'coinbase-pro-node';

export abstract class BaseExchangeClient {
  key: string;
  secret: string;
  passphrase: string;
  abstract get client(): any;
  isUp = false;
  type: ExchangeName;

  exchangeId: number;
  userId: number;

  isSyncing = false;
  accountsToSync: Account[];
  ordersToFetch: string[];
  syncedTransactions: Transaction[] = [];
  finishSyncCallback: FinishExchangeSyncCallback;

  protected abstract handleConnection();
  abstract getBalance(): Promise<any>;
  abstract getTradablePairs(): Promise<any>;
  abstract getTransactions(userId: number, exchangeId: number, callback: FinishExchangeSyncCallback): Promise<any>;
  abstract setTrade(): Promise<any>;
  abstract disconnect();

  protected getClient(): any {
    if (!this.client) {
      throw new Error('client is not connected.  please connect first');
    }
    return this.client;
  }

  resetSyncData() {
    this.syncedTransactions = [];
    this.ordersToFetch = [];
    this.accountsToSync = [];
  }

  finishSync() {
    if (this.isSyncing) {
      this.isSyncing = false;
      this.finishSyncCallback(this.userId, this.exchangeId, this.syncedTransactions);
    }
  }

  constructor(protected taskQueueService: TaskQueueService) {}
}
