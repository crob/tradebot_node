import KrakenClient from 'kraken-api';
import { BaseExchangeClient } from './base-exchange-service';
import { KrakenApi } from '../../enums';
import { AccountBalance } from '../../models/account-balance';
import { ExchangeName, OrderType, SideType, Transaction } from '@prisma/client';
import { TaskQueueService } from '../task-queue.service';
import { FinishExchangeSyncCallback } from 'trade_bot';
import { KrakenOrderType, KrakenTradeHistoryAPIResponse, KrakenTradeHistoryItem, KrakenTradeHistoryTradesMap, KrakenTradeType } from '../../models/kraken/kraken-trade-history';
import { KrakenTradePairMap, KrakenTradePairResponse } from '../../models/kraken/kraken-trade-pair';
import { $log } from '@tsed/common';

export class KrakenService extends BaseExchangeClient {
  client: KrakenClient;
  type = ExchangeName.KRAKEN
  tradingPairs: KrakenTradePairMap;

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

  async getTradablePairs(): Promise<KrakenTradePairMap> {
    const response = await this.getClient().api(KrakenApi.AssetPairs) as KrakenTradePairResponse;
    this.tradingPairs = response.result;
    return this.tradingPairs;
  }

  setTrade() {
    return this.getClient().api(KrakenApi.AssetPairs)
  }

  async getTransactions(userId: number, exchangeId: number, lastOffset: number = null, finishSyncCallback: FinishExchangeSyncCallback): Promise<boolean> {
    if (!this.isSyncing) {
      this.isSyncing = true;
      this.userId = userId;
      this.exchangeId = exchangeId;
      this.resetSyncData();
      this.finishSyncCallback = finishSyncCallback;

      try {
        await this.getTradablePairs();
        this.lastOffset = lastOffset;
        const tradeHistory = await this.recursivlyFetchAccountHistory(lastOffset || 0);
        this.syncedTransactions = this.convertHistoryToTransactions(tradeHistory).filter((transction: Transaction) => transction.coin !== 'USDC');
        $log.info('finishing kraken?', exchangeId)
        this.finishSync();

      }catch (e) {
        $log.error(e);
        this.finishSync();

      }
    }
    return this.isSyncing;
  }

  private convertHistoryToTransactions(trades: KrakenTradeHistoryTradesMap): Transaction[] {
    const transactions = [];
    for (const tradeKey of Object.keys(trades)) {
      const trade = trades[tradeKey];
      if (parseFloat(trade.margin) === 0) {
        transactions.push(this.convertKrakenTradeToTransaction(trade));
      }
    }
    return transactions;
  }

  private async recursivlyFetchAccountHistory(pageOffset = 0, tradeHistory: KrakenTradeHistoryTradesMap = {}): Promise<KrakenTradeHistoryTradesMap> {
    const response = await this.getClient().api(KrakenApi.TradesHistory, {
      ofs: pageOffset
    }) as KrakenTradeHistoryAPIResponse;

    tradeHistory = {...tradeHistory, ...response.result.trades}
    const size = Object.keys(tradeHistory).length;

    if (response.result.count > size) {
      return await this.recursivlyFetchAccountHistory(size, tradeHistory);
    } else {
      $log.info("adding to lastOffset", this.lastOffset, response.result.count)
      // this.lastOffset += response.result.count;
      return tradeHistory;
    }
  }

  private convertKrakenTimeToDate(time: number): Date {
    const tradeDate = new Date(0);
    const [seconds, milisecounds] = time.toString().split('.');
    tradeDate.setUTCSeconds(parseFloat(seconds));
    tradeDate.setUTCMilliseconds(parseInt(milisecounds, 10));
    return tradeDate;
  }

  private convertKrakenTradeToTransaction(trade: KrakenTradeHistoryItem): Transaction {
    const { price, vol, time } = trade;

    const tradeDate =  this.convertKrakenTimeToDate(time);

    const transaction: Partial<Transaction> = {
      exchangeId: this.exchangeId,
      settled: true,
      filled: true,
      type: (trade.ordertype === KrakenOrderType.Limit) ? OrderType.LIMIT : OrderType.MARKET,
      openedAt: tradeDate,
      doneAt: tradeDate,
      fees: parseFloat(trade.fee),
      purchasePrice: parseFloat(price),
      amount: parseFloat(vol),
      side: (trade.type === KrakenTradeType.Buy) ? SideType.BUY : SideType.SELL,
      post: false, // ? is there a way to know?
      coin: this.normalizeKrakenCoin(trade.pair),
      coinName: ''
    };
    return transaction as Transaction;
  }

  // Kraken makes up its own names for things because it thinks its cool?
  normalizeKrakenCoin(tradePairKey: string): string {
    if (this.tradingPairs[tradePairKey]) {
      let baseName = this.tradingPairs[tradePairKey].base;
      // like lets randomly throw an extra X infront of the coin name?
      if (baseName.length === 4 && baseName[0] === 'X') {
        baseName = baseName.substr(1);
      }
      if (baseName === 'XBT') {  // or it completely changes BTC to something else?
        return 'BTC'; // Kraken why are you like this?
      }
      return baseName;
    }
    return tradePairKey;
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