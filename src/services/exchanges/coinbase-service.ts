import { BaseExchangeApi } from '../../models';
import { BaseExchangeClient } from './base-exchange-service';
import CoinbasePro from 'coinbase-pro-node';
import { ExchangeType } from '../../enums';
import { AccountBalance } from '../../models/account-balance';

export class CoinbaseService extends BaseExchangeClient implements BaseExchangeApi {
  private static instance: CoinbaseService;
  type = ExchangeType.CoinbasePro;
  client: CoinbasePro;
  useSandbox = false;

  constructor() {
    super();
  }

  static getInstance() {
    if (!CoinbaseService.instance) {
      CoinbaseService.instance = new CoinbaseService();
    }
    return CoinbaseService.instance;
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
      this.client = new CoinbasePro({
        apiKey: this.key,
        apiSecret: this.secret,
        passphrase: this.passphrase,
        useSandbox: this.useSandbox
      });
      this.isUp = true;
    } catch(e) {
      throw new Error("Coinbase Client is not up");
    }
  }

  getTradablePairs() {
    return this.getClient().api('AssetPairs')
  }

  setTrade() {
    return this.getClient().api('AssetPairs')
  }

  async getBalance(): Promise<AccountBalance[]> {
    try {
      const accounts = await this.client.rest.account.listAccounts();
      if (accounts) {
        return accounts.filter(acct => parseFloat(acct.balance) > 0).map((acct) => {
          // console.log("acct", acct)
          return {
            ticker: acct.currency,
            balance: parseFloat(acct.balance),
          } as AccountBalance;
        });
      }
    } catch(e) {
      throw new Error(e);
    }
    return [];
  }
}