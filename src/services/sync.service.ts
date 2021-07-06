import { Injectable } from '@tsed/di';
import { PortfolioService } from './portfolio.service';
import { ExchangeService } from './exchange.service';
import { Exchange, ExchangeName, Portfolio, Transaction } from '@prisma/client';
import { ExchangeClientFactoryService } from './exchange-apis';
import { TaskQueueService } from './task-queue.service';
import { TaskType } from '../enums/task-type';
import { SyncStatus } from '../enums/sync-status';
import { TransactionService } from './transaction.service';
import { PortfolioAssetService } from './portfolio-asset.service';
import { $log } from '@tsed/logger';
import { UserSocketService } from '../sockets/user-socket.service';
import { PortfolioWithAssets } from '../models/portfolio-with-assets';

type TransactionMap = {[coin: string]: Transaction[]};

@Injectable()
export class SyncService {

  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly exchangeService: ExchangeService,
    private readonly transactionService: TransactionService,
    private readonly portfolioAssetService: PortfolioAssetService,
    private readonly exchangeClientFactoryService: ExchangeClientFactoryService,
    private readonly taskQueueService: TaskQueueService,
    private readonly userSocketService: UserSocketService
  ) {}

  exchangesToQueue: Exchange[] = [];

  async finishUserSync(userId: number): Promise<boolean> {
    try {
      await this.processPortfolio(userId);
    } catch(error) {
      $log.info(error)
      return false;
    }
    return true;
  }

  finishExchangeSync = async (userId, exchangeId, transactions: Transaction[], lastOffset: number): Promise<Transaction[]> => {
    await this.transactionService.saveTransactions(exchangeId, transactions || []);

    await this.exchangeService.updateExchangeSyncStatus(exchangeId, SyncStatus.SYNCED, lastOffset);

    if (await this.isUserSynced(userId)) {
      await this.finishUserSync(userId);
    }

    setTimeout(async () => {
      await this.startNextSync();
    }, 1)
    return transactions;
  }

  async isUserSynced(userId: number): Promise<boolean> {
    const exchanges = await this.exchangeService.getExchangesByUserId(userId);
    return exchanges.length === exchanges.filter(exchange => exchange.syncStatus === SyncStatus.SYNCED).length;
  }

  async syncUserExchanges(userId: number): Promise<any> {
    const exchanges = await this.exchangeService.getExchangesByUserId(userId);
    if (exchanges.length > 0) {
      await this.exchangeService.setAllUserExchangesToSyncing(userId);
      this.exchangesToQueue = this.exchangesToQueue.concat(exchanges);
      this.startNextSync();
    } else {
      $log.info(`Sync of user: ${userId} complete. nothing to sync.`)
      this.finishUserSync(userId);
    }

    return null;
  }

  async startNextSync(): Promise<any> {
    if (this.exchangesToQueue.length > 0) {
      const exchange = this.exchangesToQueue.pop();
      return await this.fetchTransactionsForSync(exchange.userId, exchange);
    }
    return null;
  }

  async fetchTransactionsForSync(userId: number, exchange: Exchange): Promise<boolean> {
    $log.info("starting sync for exhange", exchange.id, exchange.name);
    const exchangeClient = this.exchangeClientFactoryService.getClientById(userId, exchange);
    return await exchangeClient.getTransactions(userId, exchange.id, exchange.lastOffset, this.finishExchangeSync);
  }

  async forcePortfolioSync(userId: number): Promise<Portfolio> {
    const portfolio = await this.portfolioService.getOrCreatePortfolio(userId);
    this.queueSyncPortfolio(portfolio.id);
    portfolio.syncStatus = SyncStatus.SYNCING;
    return portfolio;
  }

  queueSyncPortfolio(portfolioId: number) {
    const newJob = this.taskQueueService.createTask(TaskType.SyncPortfolio, async (job, done) => {
      try {
        await this.syncPortfolio(job.data.portfolioId);
      } catch(err) {
        done(err);
        return;
      }
      done();
    });
    this.taskQueueService.runJob(newJob, { portfolioId });
  }

  async getUserTransactions(userId: number): Promise<TransactionMap> {
    const exchanges = await this.exchangeService.getExchangesByUserId(userId, true);
    let transactions: Transaction[] = [];
    exchanges.forEach(exchange => transactions = transactions.concat(exchange.transactions));
    const transactionMap = {};
    transactions.forEach((transaction: Transaction) => {
      if (!transactionMap[transaction.coin]) {
        transactionMap[transaction.coin] = [];
      }
      transactionMap[transaction.coin].push(transaction);
    });
    return transactionMap;
  }

  async processPortfolio(userId: number, updateSyncStatus = true): Promise<Portfolio> {
    const portfolio = await this.portfolioService.getByUserId(userId);
    const transactionMap = await this.getUserTransactions(userId);
    for (const coin of Object.keys(transactionMap)) {
      await this.portfolioAssetService.convertTransactionsToAsset(portfolio.id, transactionMap[coin])
    }
    let finishedPortfolio: PortfolioWithAssets;
    if (updateSyncStatus) {
      finishedPortfolio = await this.portfolioService.updateSyncStatus(portfolio.id, SyncStatus.SYNCED, true);
    } else {
      finishedPortfolio = await this.portfolioService.getById(portfolio.id, true);
    }
    $log.info('finishing sync');
    this.userSocketService.portfolioReceived(finishedPortfolio);
    return finishedPortfolio;
  }

  async syncPortfolio(portfolioId: number): Promise<Portfolio> {
    $log.info('starting sync')
    const portfolio = await this.portfolioService.getById(portfolioId);

    // will probably check against last synced date
    // if (portfolio.syncStatus === SyncStatus.NOT_SYNCED) {
    await this.portfolioService.updateSyncStatus(portfolioId, SyncStatus.SYNCING);
    await this.syncUserExchanges(portfolio.userId);
    // }

    return portfolio;
  }
}