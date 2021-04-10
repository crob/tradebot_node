import { Injectable } from '@tsed/di';
import { PrismaService } from './prisma-service';
import { SyncStatus } from '../enums/sync-status';
import { Portfolio } from '@prisma/client';
import { PortfolioWithAssets } from '../models/portfolio-with-assets';

@Injectable()
export class PortfolioService {

  async getOrCreatePortfolio(userId: number): Promise<PortfolioWithAssets> {
    const portfolio = await this.getByUserId(userId);

    if (!portfolio) {
      return await this.createPortfolio(userId);
    }
    return portfolio;
  }

  async createPortfolio(userId: number): Promise<PortfolioWithAssets> {
    const portfolio = await PrismaService.getInstance().connection.portfolio.create({
      data: {
        userId
      }
    });
    return portfolio;
  }

  async getAll(): Promise<PortfolioWithAssets[]>  {
    return await PrismaService.getInstance().connection.portfolio.findMany();
  }

  async getByUserId(userId: number, includeAssets = true): Promise<Portfolio> {
    return await PrismaService.getInstance().connection.portfolio.findFirst({
      where: {
        userId
      },
      include: {
        portfolioAssets: includeAssets
      }
    });
  }

  async getById(id: number, includeAssets = true): Promise<PortfolioWithAssets> {
    return await PrismaService.getInstance().connection.portfolio.findUnique({
      where: {
        id
      },
      include: {
        portfolioAssets: includeAssets,
      }
    });
  }

  async updateSyncStatus(portfolioId: number, syncStatus: SyncStatus, includeAssets = false): Promise<PortfolioWithAssets> {
    const data = {
      syncStatus
    } as any;
    if (syncStatus === SyncStatus.SYNCED) {
      data.lastSyncAt = new Date();
    }
    return await PrismaService.getInstance().connection.portfolio.update({
      where: {
        id: portfolioId
      },
      data,
      include: {
        portfolioAssets: includeAssets
      }
    });
  }

  async removePortfolio(id: number): Promise<Portfolio> {
    await PrismaService.getInstance().connection.portfolioAsset.deleteMany({
      where: {
        portfolioId: id
      }
    });
    return await PrismaService.getInstance().connection.portfolio.delete({
      where: {
        id
      }
    });
  }
}
