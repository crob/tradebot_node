import { Injectable } from '@tsed/di';
import { KrakenService } from './kraken-service';
import { CoinbaseService } from './coinbase-service';
import { BitstampService } from './bitstamp.service';
import { Exchange, ExchangeName } from '@prisma/client';
import { BaseExchangeClient } from '.';
import { TaskQueueService } from '../task-queue.service';

@Injectable()
export class ExchangeClientFactoryService {
  constructor(private taskQueueService: TaskQueueService) {}

  users: {[userId: number]: BaseExchangeClient[] } = {};

  getClientByType(userId: number, exchangeName: ExchangeName): BaseExchangeClient {
    return this.users[userId].find((service: BaseExchangeClient) => service.type === exchangeName);
  }

  getClientById(userId: number, exchangeId: number): BaseExchangeClient {
    return this.users[userId].find((service: BaseExchangeClient) => service.exchangeId === exchangeId);
  }

  createClients(userId, exchanges: Exchange[]) {
    this.users[userId] = exchanges.map((exchange: Exchange) => this.getClient(exchange));
  }

  getClient(exchange: Exchange): BaseExchangeClient {
    let client;
    switch(exchange.name) {
      case ExchangeName.BITSTAMP:
        client = new BitstampService(this.taskQueueService);
        client.connect(exchange.apiKey, exchange.apiSecret, exchange.apiThird);
        break;
      case ExchangeName.COINBASEPRO:
        client = new CoinbaseService(this.taskQueueService);
        client.connect(exchange.apiKey, exchange.apiSecret, exchange.apiThird);
        break;
      case ExchangeName.KRAKEN:
        client = new KrakenService(this.taskQueueService);
        client.connect(exchange.apiKey, exchange.apiSecret);
        break;
      default:
        client = null;
        break;
    }
    client.exchangeId = exchange.id;
    return client;
  }

  addClientToUser(userId, exchange: Exchange) {
    const existingExchange = this.getClientById(userId, exchange.id);

    if (existingExchange) {
      const indexOf = this.users[userId].indexOf(existingExchange);
      existingExchange.disconnect();
      this.users[userId].splice(indexOf, 1, this.getClient(exchange));
    } else {
      this.users[userId].push(this.getClient(exchange));
    }
  }
}