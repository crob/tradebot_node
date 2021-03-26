import { BaseExchangeClient } from './base-exchange-service';
import CoinbasePro, { Account, AccountHistory, AccountHistoryDetails, FilledOrder, Order, Pagination } from 'coinbase-pro-node';
import { AccountBalance } from '../../models/account-balance';
import { ExchangeName, OrderType, Transaction } from '@prisma/client';
import { TaskQueueService } from '../task-queue.service';
import { TaskType } from '../../enums/task-type';

export class CoinbaseService extends BaseExchangeClient {
  type = ExchangeName.COINBASEPRO;
  client: CoinbasePro;
  useSandbox = false;

  exchangeId: number;
  userId: number;

  isSyncing = false;
  stop = false;
  accountsToSync: Account[];
  accountsWithHistory: {
    [currency: string]: AccountHistory[]
  } = {};
  syncedTransactions: Transaction[] = [];

  constructor(
    protected taskQueueService: TaskQueueService
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

  async getTransactions(userId: number, exchangeId: number): Promise<boolean> {
    if (!this.isSyncing) {
      this.userId = userId;
      this.exchangeId = exchangeId;
      this.isSyncing = true;
      this.accountsToSync = await this.client.rest.account.listAccounts();
      this.queueSyncAccountHistory(this.accountsToSync.pop());
    }
    return this.isSyncing;
  }

  queueSyncAccountHistory(account: Account) {
    const newJob = this.taskQueueService.createTask(TaskType.SyncCoinbaseAccount, async (job, done) => {
      try {
        const historyItems = await this.fetchAccountHistoryRecursive(job.data.accountId);
        if (historyItems.length > 0 && this.stop === false) {
          this.stop = true;
          this.accountsWithHistory[job.data.currency] = historyItems;
        }
      } catch(err) {
        done(err);
        return;
      }
      done();
    });

    this.taskQueueService.runJob(newJob, { accountId: account.id, currency: account.currency });

    newJob.on('succeeded', (job) => {
      // when the history has been fetched pop the next account off the stack
      if (this.accountsToSync.length > 0) {
        this.queueSyncAccountHistory(this.accountsToSync.pop());
      }
      // console.log(job.data.currency)
      if (this.accountsWithHistory[job.data.currency]) {
        this.queueSyncAccountHistoryDetails(job.data.currency, this.accountsWithHistory[job.data.currency].pop());
      }
    });
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

  queueSyncAccountHistoryDetails(currency, accountHistory: AccountHistory) {
    const newJob = this.taskQueueService.createTask(TaskType.SyncCoinbaseAccountHistoryDetails, async (job, done) => {
      try {
        const order = await this.fetchAccountHistoryDetails(job.data.orderId);

        if (order.settled) {
          const {
            post_only,
            fill_fees,
            settled,
            created_at,
            filled_size,
            done_at
          } = order as FilledOrder;

          const transaction:Partial<Transaction> = {};
          transaction.type = (order.type === 'limit') ? OrderType.LIMIT : OrderType.MARKET;
          transaction.coin = currency;
          transaction.settled = settled;
          transaction.openedAt = new Date(created_at);
          transaction.doneAt = new Date(done_at);
          transaction.filled = true;
          transaction.exchangeId = this.exchangeId;
          transaction.post = post_only;
          transaction.fees = parseFloat(fill_fees);
          transaction.purchasePrice = parseFloat(order.executed_value) / parseFloat(filled_size);
          transaction.amount = parseFloat(filled_size);
          this.syncedTransactions.push(transaction as Transaction);
          // console.log("transaction", transaction, order)
        } else {
          // tslint:disable-next-line:no-console
          console.log("not filled", order)
        }
        // if (historyItems.length > 0) {
        //   this.accountsWithHistory[job.data.currency] = historyItems;
        // }
      } catch(err) {
        done(err);
        return;
      }
      done();
    });

    this.taskQueueService.runJob(newJob, { orderId: accountHistory.details.order_id, currency });

    newJob.on('succeeded', (job) => {
      // when the history has been fetched pop the next account off the stack
      if (this.accountsWithHistory[job.data.currency]?.length > 0) {
        this.queueSyncAccountHistoryDetails(job.data.currency, this.accountsWithHistory[job.data.currency].pop());
      } else {
        // tslint:disable-next-line:no-console
        console.log(`${job.data.currency} has finished fetching orders`)
      }
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

  disconnect() {
    return null;
  }
}