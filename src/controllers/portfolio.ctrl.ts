import { Portfolio } from '@prisma/client';
import { Controller, Get, Post, Req, Delete } from '@tsed/common';
import { Authorize } from '@tsed/passport';
import { ReqUser } from '../models/req-user';
import { PortfolioService } from '../services/portfolio.service';

@Controller("/portfolio")
export class PortfolioCtrl {
  constructor(
    private readonly portfolioService: PortfolioService
  ) {}

  @Authorize()
  @Get()
  async getPortfolio(
    @Req() req: ReqUser
  ): Promise<Portfolio> {
    const porfolio = await this.portfolioService.getOrCreatePortfolio(parseInt(req.user.id, 10));

    return porfolio;
  }

  @Authorize()
  @Get('/all')
  async getAllPortfolios(
    @Req() req: ReqUser
  ): Promise<Portfolio[]> {
    const porfolios = await this.portfolioService.getAll();
    return porfolios;
  }

  @Authorize()
  @Get('/sync')
  async forceSync(
    @Req() req: ReqUser
  ): Promise<Portfolio> {
    return await this.portfolioService.forceSync(parseInt(req.user.id, 10));
  }

  @Authorize()
  @Delete()
  async deleteExchanges(
    @Req() req: ReqUser
  ): Promise<Portfolio> {
    const porfolio = await this.portfolioService.getByUserId(parseInt(req.user.id, 10));

    return await this.portfolioService.removePortfolio(porfolio.id);
  }
}
