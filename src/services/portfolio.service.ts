import { Injectable } from '@tsed/di';
import { ExchangeService } from './exchange.service';
import { PrismaService } from './prisma-service';
import { TaskQueueService } from './task-queue.service';
import { TaskType } from '../enums/task-type';
import { SyncStatus } from '../enums/sync-status';
import { Portfolio } from '@prisma/client';

@Injectable()
export class PortfolioService {

  constructor(
    private exchangeService: ExchangeService,
    private taskQueueService: TaskQueueService
  ) {

  }

  async getOrCreatePortfolio(userId: number): Promise<Portfolio> {
    const portfolio = await this.getByUserId(userId);

    if (!portfolio) {
      return await this.createPortfolio(userId);
    }
    return portfolio;
  }

  async createPortfolio(userId: number): Promise<Portfolio> {
    const portfolio = await PrismaService.getInstance().connection.portfolio.create({
      data: {
        userId
      }
    });
    this.queueSyncPortfolio(portfolio.id);
    return portfolio;
  }

  async getAll(): Promise<Portfolio[]>  {
    return await PrismaService.getInstance().connection.portfolio.findMany();
  }

  async getByUserId(userId: number): Promise<Portfolio> {
    return await PrismaService.getInstance().connection.portfolio.findFirst({
      where: {
        userId
      }
    });
  }

  async getById(id: number): Promise<Portfolio> {
    return await PrismaService.getInstance().connection.portfolio.findUnique({
      where: {
        id
      }
    });
  }

  async forceSync(userId: number): Promise<Portfolio> {
    const portfolio = await this.getByUserId(userId);
    this.queueSyncPortfolio(portfolio.id);
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

  async updateSyncStatus(portfolioId: number, syncStatus: SyncStatus): Promise<Portfolio> {
    const data = {
      syncStatus
    } as any;
    if (syncStatus === SyncStatus.SYNCED) {
      data.lastSync = new Date();
    }
    return await PrismaService.getInstance().connection.portfolio.update({
      where: {
        id: portfolioId
      },
      data
    });
  }

  async syncPortfolio(portfolioId: number): Promise<Portfolio> {
    await this.updateSyncStatus(portfolioId, SyncStatus.SYNCING);

    const portfolio = await this.getById(portfolioId);

    const exchanges = await this.exchangeService.getExchangesByUserId(portfolio.userId);

    exchanges.forEach(async (exchange) => await this.exchangeService.fetchTransactionsForSync(portfolio.userId, exchange.id, exchange.name));

    await this.updateSyncStatus(portfolioId, SyncStatus.SYNCED);
    return portfolio;
  }

  async removePortfolio(id: number): Promise<Portfolio> {
    return await PrismaService.getInstance().connection.portfolio.delete({
      where: {
        id
      }
    });
  }
}
