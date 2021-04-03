import { Portfolio, PortfolioAsset } from '@prisma/client';

export interface PortfolioWithAssets extends Portfolio{
  portfolioAssets?: PortfolioAsset[];
}