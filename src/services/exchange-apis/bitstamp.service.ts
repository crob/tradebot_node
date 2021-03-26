import { BaseExchangeClient } from './base-exchange-service';
import { Bitstamp } from 'node-bitstamp'
import { AccountBalance } from '../../models/account-balance';
import { ExchangeName } from '@prisma/client';
import { TaskQueueService } from '../task-queue.service';

export class BitstampService extends BaseExchangeClient {
  type = ExchangeName.BITSTAMP;
  client: Bitstamp;
  useSandbox = false;

  constructor(protected taskQueueService: TaskQueueService) {
    super(taskQueueService);
  }

  connect(key: string, secret: string, passphrase: string, useSandbox = false) {
    this.key = key;
    this.secret = secret;
    this.passphrase = passphrase;
    this.useSandbox = useSandbox;
    this.handleConnection();
  }

  protected handleConnection() {
    try {
      this.client = new Bitstamp({
        key: this.key,
        secret: this.secret,
        clientId: this.passphrase,
        timeout: 5000,
        rateLimit: true
      });
      this.isUp = true;
    } catch(e) {
      throw new Error("Bitstamp Client is not up");
    }
  }

  getTradablePairs() {
    return null;
    // return this.getClient().api('AssetPairs')
  }

  getTransactions(userId: number, exchangeId: number) {
    return null;
  }

  setTrade() {
    return null;
    // return this.getClient().api('AssetPairs')
  }

  async getBalance(): Promise<AccountBalance[]> {
    try {
      const response = await this.getClient().balance();
      // tslint:disable-next-line:no-console
      console.log(response.body)
      // const accounts = await this.client.rest.account.listAccounts();
      // if (accounts) {
      //   return accounts.filter(acct => parseFloat(acct.balance) > 0).map((acct) => {
      //     // console.log("acct", acct)
      //     return {
      //       ticker: acct.currency,
      //       balance: parseFloat(acct.balance),
      //     } as AccountBalance;
      //   });
      // }
    } catch(e) {
      throw new Error(e);
    }
    return [];
  }

  disconnect() {
    return null;
  }
}