import { BaseExchangeClient } from './base-exchange-service';
import { Bitstamp, CURRENCY, BitstampUserTransactionResponse, IBitstampUserTransaction } from 'node-bitstamp';
import { AccountBalance } from '../../models/account-balance';
import { ExchangeName, OrderType, SideType, Transaction } from '@prisma/client';
import { TaskQueueService } from '../task-queue.service';
import { FinishExchangeSyncCallback } from 'trade_bot';
import { $log } from '@tsed/common';

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
  }

  async getTransactions(userId: number, exchangeId: number, lastOffset: number = null, finishSyncCallback: FinishExchangeSyncCallback): Promise<boolean>  {
    if (!this.isSyncing) {
      this.isSyncing = true;
      this.userId = userId;
      this.exchangeId = exchangeId;
      this.resetSyncData();
      this.finishSyncCallback = finishSyncCallback;

      try {
        const btcTransactionsResponse: BitstampUserTransactionResponse = await this.client.userTransaction(CURRENCY.BTC_USD);
        this.convertAllTransactions(CURRENCY.BTC_USD, btcTransactionsResponse.body);
        const ethTransactionsResponse: BitstampUserTransactionResponse = await this.client.userTransaction(CURRENCY.ETH_USD);
        this.convertAllTransactions(CURRENCY.ETH_USD, ethTransactionsResponse.body);
        // const xrpTransactionsResponse: BitstampUserTransactionResponse = await this.client.userTransaction(CURRENCY.XRP_USD);
        // this.convertAllTransactions(CURRENCY.XRP_USD, xrpTransactionsResponse.body);
        const xlmTransactionsResponse: BitstampUserTransactionResponse = await this.client.userTransaction(CURRENCY.XLM_USD);
        this.convertAllTransactions(CURRENCY.XLM_USD, xlmTransactionsResponse.body);

        this.finishSync();

      }catch (e) {
        $log.error(e);
        this.finishSync();
      }
    }
    return this.isSyncing;
  }

  private convertAllTransactions(currency: CURRENCY, orders: IBitstampUserTransaction[]) {
    this.syncedTransactions = this.syncedTransactions.concat(orders.map((order: IBitstampUserTransaction) => this.convertBitStampOrderToTransaction(currency, order)));
  }

  private convertBitStampOrderToTransaction(currency: CURRENCY, order: IBitstampUserTransaction): Transaction {
    const { datetime, usd} = order;
    const tradeDate = new Date(datetime);
    const transaction: Partial<Transaction> = {
      exchangeId: this.exchangeId,
      settled: true,
      filled: true,
      type: OrderType.LIMIT,// (trade.ordertype === KrakenOrderType.Limit) ? OrderType.LIMIT : OrderType.MARKET,
      openedAt: tradeDate,
      doneAt: tradeDate,
      fees: parseFloat(order.fee), // parseFloat(trade.fee),
      purchasePrice: this.getPurchasePriceField(currency, order),
      amount: this.getAmountField(currency, order),
      side: (parseFloat(usd) < 0) ? SideType.BUY : SideType.SELL,
      post: false, // ? is there a way to know?
      coin: currency.toString().substr(0, 3).toUpperCase(), // this.normalizeKrakenCoin(trade.pair),
      coinName: ''
    };
    return transaction as Transaction;
  }

  getAmountField(currency: CURRENCY, order: IBitstampUserTransaction): number {
    let amount: string;
    switch(currency) {
      case CURRENCY.BTC_USD:
        amount = order.btc;
        break;
      case CURRENCY.ETH_USD:
        amount = order.eth;
        break;
      case CURRENCY.XRP_USD:
        amount = order.xrp;
        break;
      case CURRENCY.XLM_USD:
        amount = order.xlm;
        break;
      default:
        amount = '0';
    }
    return parseFloat(amount);
  }

  getPurchasePriceField(currency: CURRENCY, order: IBitstampUserTransaction): number {
    let amount: number;
    switch(currency) {
      case CURRENCY.BTC_USD:
        amount = order.btc_usd;
        break;
      case CURRENCY.ETH_USD:
        amount = order.eth_usd;
        break;
      case CURRENCY.XRP_USD:
        amount = order.xrp_usd;
        break;
      case CURRENCY.XLM_USD:
        amount = order.xlm_usd;
        break;
      default:
        amount = 0;
    }
    return amount;
  }

  setTrade() {
    return null;
    // return this.getClient().api('AssetPairs')
  }

  async getBalance(): Promise<AccountBalance[]> {
    try {
      const response = await this.getClient().balance();
      // tslint:disable-next-line:no-console
      $log.info(response.body)
      // const accounts = await this.client.rest.account.listAccounts();
      // if (accounts) {
      //   return accounts.filter(acct => parseFloat(acct.balance) > 0).map((acct) => {
      //     // $log.info("acct", acct)
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