import { Holding, PortfolioAsset, TaxEvent } from '@prisma/client';

export interface PortfolioAssetWithChildren extends PortfolioAsset {
  taxEvents?: TaxEvent[];
  holdings?: Holding[];
}
