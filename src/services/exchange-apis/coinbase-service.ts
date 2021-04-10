import { BaseExchangeClient } from './base-exchange-service';
import CoinbasePro, { Account, AccountHistory, FilledOrder, Order, Pagination, OrderType as CBOrderType, WebSocketChannelName, WebSocketEvent } from 'coinbase-pro-node';
import { AccountBalance } from '../../models/account-balance';
import { ExchangeName, OrderType, SideType, Transaction } from '@prisma/client';
import { TaskQueueService } from '../task-queue.service';
import { TaskType } from '../../enums/task-type';
import { FinishExchangeSyncCallback } from 'trade_bot';
import { OrderSide as CBOrderSide } from 'coinbase-pro-node';
import { $log } from '@tsed/common';
import { UserSocketService } from '../../sockets/user-socket.service';

export class CoinbaseService extends BaseExchangeClient {
  type = ExchangeName.COINBASEPRO;
  client: CoinbasePro;
  useSandbox = false;


  constructor(
    protected taskQueueService: TaskQueueService,
    // private userSocketService: UserSocketService
  ) {
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

  async getTransactions(userId: number, exchangeId: number, lastOffset: number = null, finishSyncCallback: FinishExchangeSyncCallback): Promise<boolean> {
    if (!this.isSyncing) {
      this.isSyncing = true;
      this.userId = userId;
      this.exchangeId = exchangeId;
      this.resetSyncData();
      this.finishSyncCallback = finishSyncCallback;
      this.accountsToSync = await this.client.rest.account.listAccounts();
      this.queueSyncAccountHistory(this.accountsToSync.pop());
    }
    return this.isSyncing;
  }

  queueSyncAccountHistory(account: Account) {
    const newJob = this.taskQueueService.createTask((TaskType.SyncCoinbaseAccount + this.exchangeId) as TaskType, async (job, done) => {
      try {
        let historyItems = await this.fetchAccountHistoryRecursive(job.data.accountId);
        // filter out anything that isnt an order
        historyItems = historyItems.filter(item => item.details.order_id);
        historyItems.map(item => item.details.order_id).forEach((orderId) => {
          if (!this.ordersToFetch.includes(orderId)) {
            this.ordersToFetch.push(orderId);
          }
        });
      } catch(err) {
        $log.error("some error happeend", err)
        done(err);
        return;
      }
      done();
    });

    this.taskQueueService.runJob(newJob, { accountId: account.id, currency: account.currency });

    newJob.on('succeeded', (job) => {
      this.nextAccount();
    });

    newJob.on('error', (job) => {
      this.nextAccount();
    });
  }

  nextAccount() {
    // when the history has been fetched pop the next account off the stack
    if (this.accountsToSync.length > 0) {
      this.queueSyncAccountHistory(this.accountsToSync.pop());
    } else {
      this.nextOrderToFetchOrFinish();
    }
  }

  nextOrderToFetchOrFinish() {
    if (this.ordersToFetch?.length > 0) {
      const orderId = this.ordersToFetch.pop();
      $log.info("getting order", orderId)
      this.queueSyncAccountHistoryDetails(orderId);
    } else {
      this.finishSync();
    }
  }

  async fetchAccountHistoryRecursive(accountId: string, prevHistory?: AccountHistory[], pagination?: Pagination): Promise<AccountHistory[]> {
    // get the history from coinbase
    const history = await this.client.rest.account.getAccountHistory(accountId, pagination);

    // if its less than 100 and there is no previous history then we can return
    if (history.data.length < 100 && !prevHistory) {
      return history.data;
    }

    // add the new history to the existing list
    const concatedHistory = ((prevHistory) ? prevHistory : []).concat(history.data);

    // if there is more to fetch then do so
    if (history.pagination.after && history.pagination.after !== pagination?.after) {
      return await this.fetchAccountHistoryRecursive(accountId, concatedHistory, {after: history.pagination.after});
    } else {
      // finally we are done
      return concatedHistory;
    }
  }

  queueSyncAccountHistoryDetails(orderId: string) {
    const newJob = this.taskQueueService.createTask((TaskType.SyncCoinbaseAccountHistoryDetails + this.exchangeId) as TaskType, async (job, done) => {
      try {
        const order = await this.fetchAccountHistoryDetails(job.data.orderId);

        if (order.settled) {
          const {
            post_only,
            fill_fees,
            settled,
            created_at,
            side,
            filled_size,
            product_id,
            done_at
          } = order as FilledOrder;
          const [coin, fiat] = product_id.split('-');
          const transaction:Partial<Transaction> = {};
          transaction.type = (order.type === CBOrderType.LIMIT) ? OrderType.LIMIT : OrderType.MARKET;
          transaction.coin = coin;
          transaction.coinName = fiat;
          transaction.settled = settled;
          transaction.openedAt = new Date(created_at);
          transaction.doneAt = new Date(done_at);
          transaction.filled = true;
          transaction.exchangeId = this.exchangeId;
          transaction.post = post_only;
          transaction.fees = parseFloat(fill_fees);
          transaction.purchasePrice = parseFloat(order.executed_value) / parseFloat(filled_size);
          transaction.amount = parseFloat(filled_size);
          transaction.side = (side === CBOrderSide.BUY) ? SideType.BUY : SideType.SELL;

          this.syncedTransactions.push(transaction as Transaction);
          // $log.info("transaction", transaction, order)
        } else {
          $log.info("not filled", order)
        }
      } catch(err) {
        $log.info("error fetching order", job.data.orderId)
        done(err);
        return;
      }
      done();
    });

    this.taskQueueService.runJob(newJob, { orderId });

    newJob.on('succeeded', (job) => {
      this.nextOrderToFetchOrFinish();
    });

    newJob.on('error', (job) => {
      this.nextOrderToFetchOrFinish();
    });
  }


  async fetchAccountHistoryDetails(orderId): Promise<Order> {
    return await this.client.rest.order.getOrder(orderId);
  }

  setTrade() {
    return this.getClient().api('AssetPairs')
  }

  async getBalance(): Promise<AccountBalance[]> {
    try {
      const accounts = await this.client.rest.account.listAccounts();
      if (accounts) {
        return accounts.filter(acct => parseFloat(acct.balance) > 0).map((acct) => {
          // $log.info("acct", acct)
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

  connectToSocket(pairs: string[]) {
    const channel = {
      name: WebSocketChannelName.TICKER,
      product_ids: pairs.map(pair => `${pair}-USD`),
    };

    // 3. Wait for open WebSocket to send messages
    this.client.ws.on(WebSocketEvent.ON_OPEN, () => {
      // 7. Subscribe to WebSocket channel
      this.client.ws.subscribe([channel]);
    });

    // 4. Listen to WebSocket subscription updates
    this.client.ws.on(WebSocketEvent.ON_SUBSCRIPTION_UPDATE, subscriptions => {
      // When there are no more subscriptions...
      if (subscriptions.channels.length === 0) {
        // 10. Disconnect WebSocket (and end program)
        this.client.ws.disconnect();
      }
    });

    // 5. Listen to WebSocket channel updates
    this.client.ws.on(WebSocketEvent.ON_MESSAGE_TICKER, tickerMessage => {
      // 8. Receive message from WebSocket channel
      $log.info(`Received message of type "${tickerMessage.type}".`, tickerMessage);
      // 9. Unsubscribe from WebSocket channel
      this.client.ws.unsubscribe([
        {
          name: WebSocketChannelName.TICKER,
          product_ids: [tickerMessage.product_id],
        },
      ]);
    });

    // 6. Connect to WebSocket
    this.client.ws.connect({debug: true});

  }

  disconnect() {
    return null;
  }
}