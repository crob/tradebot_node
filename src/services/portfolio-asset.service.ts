import { PortfolioAsset, SideType, Transaction } from '@prisma/client';
import { $log } from '@tsed/common';
import { Injectable } from '@tsed/di';
import { PrismaService } from './prisma-service';

@Injectable()
export class PortfolioAssetService {

  async getAssetsByPortfolioId(portfolioId: number): Promise<PortfolioAsset[]> {
    return await PrismaService.getInstance().connection.portfolioAsset.findMany({where: {portfolioId}});
  }

  async saveAsset(portfolioAsset: PortfolioAsset): Promise<PortfolioAsset> {
    return await PrismaService.getInstance().connection.portfolioAsset.create({data: portfolioAsset});
  }

  async deleteByCoin(coin: string): Promise<any> {
    return await PrismaService.getInstance().connection.portfolioAsset.deleteMany({where: {coin}});
  }

  async delete(id: number): Promise<any> {
    return await PrismaService.getInstance().connection.portfolioAsset.delete({where: {id}});
  }

  async convertTransactionsToAsset(portfolioId: number, transactions: Transaction[]): Promise<PortfolioAsset> {
    const portfolioAsset: Partial<PortfolioAsset> = {
      portfolioId,
      amount: 0,
      total: 0
    };
    // should sort by date

    transactions.sort((a: Transaction, b: Transaction) => {
      return a.doneAt.getTime() - b.doneAt.getTime();
    });


    transactions.forEach((transaction: Transaction) => {
      const {coin, purchasePrice, side} = transaction;
      let { amount } = transaction;

      portfolioAsset.coin = coin;

      amount = Math.abs(amount);

      if (side === SideType.BUY) {
        portfolioAsset.amount += amount;
        portfolioAsset.total += amount * purchasePrice;

      } else {
        portfolioAsset.amount -= amount;
        portfolioAsset.total -= amount * purchasePrice;
      }

      if (coin === 'XTZ') {
        $log.info(coin, side, amount, purchasePrice, portfolioAsset.amount, transaction.exchangeId, transaction.fees)
      }
    });

    portfolioAsset.averagePrice = (portfolioAsset.amount > 0) ? portfolioAsset.total / portfolioAsset.amount : 0;

    await this.deleteByCoin(portfolioAsset.coin);
    return await this.saveAsset(portfolioAsset as PortfolioAsset);
  }
}