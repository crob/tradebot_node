import { Holding, PortfolioAsset, Prisma, SideType, TaxEvent, TaxEventType, TaxStrategy, Transaction } from '@prisma/client';
import { $log } from '@tsed/common';
import { Injectable } from '@tsed/di';
import { tagsReducer } from '@tsed/schema';
import { textChangeRangeIsUnchanged } from 'typescript';
import { PortfolioAssetWithChildren } from '../models/portfolio-asset-with-children';
import { PrismaService } from './prisma-service';

@Injectable()
export class PortfolioAssetService {

  async getAssetsByPortfolioId(portfolioId: number, includeChildren = true): Promise<PortfolioAssetWithChildren[]> {
    return await PrismaService.getInstance().connection.portfolioAsset.findMany({
      where: {portfolioId},
      include: {
        taxEvents: includeChildren,
        holdings: includeChildren
      }
    });
  }

  async saveAsset(portfolioAsset: Partial<PortfolioAsset>, extra?: {taxEvents?: Partial<TaxEvent>[], holdings?: Partial<Holding>[]}): Promise<PortfolioAssetWithChildren> {
    const asset = {
      data: portfolioAsset as any
    };
    if (extra) {
      const { taxEvents, holdings} = extra;
      if (taxEvents?.length > 0) {
        asset.data.taxEvents = { create: taxEvents };
      }

      if (holdings?.length > 0) {
        asset.data.holdings ={ create: holdings };
      }
    }

    return await PrismaService.getInstance().connection.portfolioAsset.create(asset);
  }

  async deleteByCoin(portfolioId: number, coin: string): Promise<any> {
    const existingPA = await PrismaService.getInstance().connection.portfolioAsset.findFirst({where: {
      portfolioId,
      coin
    }});
    if (existingPA) {
      await PrismaService.getInstance().connection.taxEvent.deleteMany({where: {
        portfolioAssetId: existingPA.id
      }});
      await PrismaService.getInstance().connection.holding.deleteMany({where: {
        portfolioAssetId: existingPA.id
      }});
    }
    return await PrismaService.getInstance().connection.portfolioAsset.deleteMany({where: {
      portfolioId,
      coin
    }});
  }

  async deleteByPortfolioId(portfolioId: number) {
    const portfolioAssets = await PrismaService.getInstance().connection.portfolioAsset.findMany({where: {portfolioId}});
     portfolioAssets.forEach(async (portfolioAsset) => {
       await this.delete(portfolioAsset.id);
     });
  }

  async delete(id: number): Promise<any> {
    try {
      await PrismaService.getInstance().connection.holding.deleteMany({where: {portfolioAssetId: id}});
      await PrismaService.getInstance().connection.taxEvent.deleteMany({where: {portfolioAssetId: id}});
    } catch(e) {
      $log.error(e);
    }
    return await PrismaService.getInstance().connection.portfolioAsset.delete({where: {id}});
  }

  async convertTransactionsToAsset(portfolioId: number, transactions: Transaction[]): Promise<PortfolioAssetWithChildren> {
    const portfolioAsset: Partial<PortfolioAssetWithChildren> = {
      portfolioId,
      amount: 0,
      totalInvested: 0
    };
    // should sort by date

    transactions.sort((a: Transaction, b: Transaction) => {
      return a.doneAt.getTime() - b.doneAt.getTime();
    });

    let holdings: Partial<Holding>[] = [];
    const taxEvents: Partial<TaxEvent>[] = [];

    transactions.forEach((transaction: Transaction, index: number) => {
      const {coin, side, fees, isManuallyAdded} = transaction;
      let { amount, purchasePrice } = transaction;

      portfolioAsset.coin = coin;

      amount = Math.abs(amount);
      purchasePrice = Math.abs(purchasePrice);

      if (side === SideType.BUY) {
        // portfolioAsset.amount += amount;
        // portfolioAsset.totalInvested += amount * purchasePrice;
        $log.info(`${transaction.coin} buy: `, transaction.amount, transaction.doneAt);
        holdings.push( {
          tradedAt: transaction.doneAt,
          coin,
          amount,
          purchasePrice,
          fees,
          side,
          isManuallyAdded
        });
      } else {
        // portfolioAsset.amount -= amount;
        // portfolioAsset.totalInvested -= amount * purchasePrice;
        const { taxEvent, newHoldings} = this.processTaxEventForSale(transaction, holdings);
        holdings = [...newHoldings];
        taxEvents.push(taxEvent);
      }

      // if (coin === 'XTZ') {
      //   $log.info(coin, side, amount, purchasePrice, portfolioAsset.amount, transaction.exchangeId, transaction.fees)
      // }
      // if (coin === 'LTC') {
      //   $log.info(coin, side, amount, purchasePrice, portfolioAsset.amount, transaction.exchangeId, transaction.fees)
      // }
    });
    portfolioAsset.totalInvested = holdings.map(holding => holding.amount * holding.purchasePrice).reduce((p, c) => p + c, 0);
    portfolioAsset.realizedPnLShort = taxEvents.map(te => te.spnl).reduce((p, c) => p + c, 0);
    portfolioAsset.realizedPnLLong = taxEvents.map(te => te.lpnl).reduce((p, c) => p + c, 0);
    portfolioAsset.amount = holdings.map(holding => holding.amount).reduce((p, c) => p + c, 0);
    portfolioAsset.averagePrice = (portfolioAsset.amount > 0) ? portfolioAsset.totalInvested / portfolioAsset.amount : 0;

    await this.deleteByCoin(portfolioId, portfolioAsset.coin);
    return await this.saveAsset(portfolioAsset, {taxEvents, holdings});
  }

  processTaxEventForSale(saleTransaction: Transaction, holdings: Partial<Holding>[]): {taxEvent: Partial<TaxEvent>, newHoldings: Partial<Holding>[]} {
    const { doneAt, fees, taxStrategy, id, coin } = saleTransaction;
    let { amount, purchasePrice } = saleTransaction;
    amount = Math.abs(amount);
    purchasePrice = Math.abs(purchasePrice);

    const taxEvent: Partial<TaxEvent> = {
      amount,
      transactionId: id,
      taxedAt: doneAt,
      coin,
      totalValue: amount * purchasePrice,
      salePrice: purchasePrice,
      spnl: 0,
      lpnl: 0
    }
    $log.info(`${saleTransaction.coin} sale: `, saleTransaction.amount, saleTransaction.doneAt);
    const holdingsCopy = [...holdings];

    switch (taxStrategy) {
      case TaxStrategy.PrioritizeLongTerm:
        // sort transactions over 12 months old to the from
        break;
      case TaxStrategy.LastInFirstOut:
        holdingsCopy.reverse();
        break;
      default:
        break;
    }
    let amountNeededToFill = amount;
    let totalAmountPaid = 0;
    while(amountNeededToFill > 0 && holdingsCopy.length > 0) {
      // pull the first holding in the list
      const holding = holdingsCopy.pop();
      // subtract the holdings amount from the amountNeededToFill
      amountNeededToFill -= holding.amount;

      let amountToUseToCalculateTotal = holding.amount;

      // if amountNeededToFill is less than 0 there is some leftover to add back
      if (amountNeededToFill < 0) {
        const remainderAmount = Math.abs(amountNeededToFill);
        amountToUseToCalculateTotal = holding.amount - remainderAmount;
        holding.amount = remainderAmount;
        holdingsCopy.splice(0, 0, holding);
      }
      totalAmountPaid += amountToUseToCalculateTotal * holding.purchasePrice;
    }
    // need to calculate the short and long term pnl
    taxEvent.spnl = Math.abs(taxEvent.totalValue) - totalAmountPaid;
    const totalPnL = taxEvent.spnl + taxEvent.lpnl
    taxEvent.type = (totalPnL > 0) ? TaxEventType.GAIN : (totalPnL === 0) ? TaxEventType.EVEN : TaxEventType.LOSS;
    // re sort holdings
    holdingsCopy.sort((a: Holding, b: Holding) => {
      return a.tradedAt.getTime() - b.tradedAt.getTime();
    });

    return {taxEvent, newHoldings: holdingsCopy};
  }
}