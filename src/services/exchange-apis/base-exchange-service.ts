import { ExchangeName } from '@prisma/client';
import { TaskQueueService } from '../task-queue.service';

export abstract class BaseExchangeClient {
  key: string;
  secret: string;
  passphrase: string;
  client: any;
  isUp = false;
  type: ExchangeName;
  exchangeId: number;

  protected abstract handleConnection();
  abstract getBalance(): Promise<any>;
  abstract getTradablePairs(): Promise<any>;
  abstract getTransactions(userId: number, exchangeId: number): Promise<any>;
  abstract setTrade(): Promise<any>;
  abstract disconnect();

  protected getClient(): any {
    if (!this.client) {
      throw new Error('client is not connected.  please connect first');
    }
    return this.client;
  }

  constructor(protected taskQueueService: TaskQueueService) {}
}
