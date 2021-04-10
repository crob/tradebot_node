import { Portfolio, PortfolioAsset } from '@prisma/client';
import { Controller, Get, Post, Req, Delete } from '@tsed/common';
import { Authorize } from '@tsed/passport';
import { ReqUser } from '../models/req-user';
import { PortfolioService } from '../services/portfolio.service';
import { SyncService } from '../services/sync.service';
import { SyncStatus } from '../enums/sync-status';
import { PortfolioWithAssets } from '../models/portfolio-with-assets';
import { PortfolioAssetService } from '../services/portfolio-asset.service';
import { UserSocketService } from '../sockets/user-socket.service';

@Controller("/portfolio")
export class PortfolioCtrl {
  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly portfolioAssetService: PortfolioAssetService,
    private syncService: SyncService,
    private userSocketService: UserSocketService
  ) {}

  @Authorize()
  @Get()
  async getPortfolio(
    @Req() req: ReqUser
  ): Promise<PortfolioWithAssets> {
    const porfolio = await this.portfolioService.getOrCreatePortfolio(parseInt(req.user.id, 10));
    if (porfolio.syncStatus === SyncStatus.NOT_SYNCED || porfolio.lastSyncAt === null) {
      this.syncService.syncPortfolio(porfolio.id);
    }
    this.userSocketService.portfolioReceived(porfolio);
    return porfolio;
  }

  @Authorize()
  @Get('/assets')
  async getPortfolioAssets(
    @Req() req: ReqUser
  ): Promise<PortfolioAsset[]> {
    const portfolio = await this.portfolioService.getOrCreatePortfolio(parseInt(req.user.id, 10));

    return await this.portfolioAssetService.getAssetsByPortfolioId(portfolio.id);
  }

  @Authorize()
  @Get('/all')
  async getAllPortfolios(
    @Req() req: ReqUser
  ): Promise<PortfolioWithAssets[]> {
    const porfolios = await this.portfolioService.getAll();
    return porfolios;
  }

  @Authorize()
  @Get('/sync')
  async forceSync(
    @Req() req: ReqUser
  ): Promise<PortfolioWithAssets> {
    return await this.syncService.forcePortfolioSync(parseInt(req.user.id, 10));
  }

  @Authorize()
  @Get('/processPortfolio')
  async processPortfolio(
    @Req() req: ReqUser
  ): Promise<PortfolioWithAssets> {
    return await this.syncService.processPortfolio(parseInt(req.user.id, 10));
  }

  @Authorize()
  @Delete()
  async deleteExchanges(
    @Req() req: ReqUser
  ): Promise<Portfolio> {
    const porfolio = await this.portfolioService.getByUserId(parseInt(req.user.id, 10));
    await this.portfolioAssetService.deleteByPortfolioId(porfolio.id);
    return await this.portfolioService.removePortfolio(porfolio.id);
  }
}
