import { Exchange, Prisma, Transaction } from '@prisma/client';
import { $log, BodyParams, Controller, Delete, Get, PathParams, Post, Req } from '@tsed/common';
import { ExchangeService } from '../services/exchange.service';
import { ExchangeView } from '../models/views/exchange-view';
import { ReqUser } from '../models/req-user';
import { Authorize } from '@tsed/passport';
import { ValidationException } from '../models/validation-exception';
import { nameof } from '../utils';
import { ValidationKeyword } from '../enums';
import { TransactionService } from '../services/transaction.service';
import { SyncService } from '../services/sync.service';
import { ExchangeClientFactoryService } from '../services/exchange-apis';
import { UserSocketService } from '../sockets/user-socket.service';

@Controller("/exchanges")
export class ExchangeCtl {
  constructor(
    private readonly exchangeService: ExchangeService,
    private readonly syncService: SyncService,
    private readonly exchangeClientFactoryService: ExchangeClientFactoryService,
    private transactionService: TransactionService,
    private readonly userSocketService: UserSocketService
  ) {}

  @Authorize()
  @Get()
  async getExchanges(
    @Req() req: ReqUser
  ): Promise<Exchange[]> {
    return await this.exchangeService.getExchangesViewModelByUserId(parseInt(req.user.id, 10));
  }

  @Authorize()
  @Get('/:id/transactions')
  async getExchangeTransactions(
    @Req() req: ReqUser,
    @PathParams("id") exchangeId: number,
  ): Promise<Transaction[]> {
    const transactions = await this.transactionService.getByExchangeId(exchangeId);
    // users = users.map(removePasswordField);
    return transactions;
  }

  @Authorize()
  @Delete()
  async clearExchanges(
    @Req() req: ReqUser
  ): Promise<number> {
    let count = 0;
    const exchanges = await this.exchangeService.getExchangesByUserId(parseInt(req.user.id, 10));
    exchanges.forEach(async ex => {
      await this.exchangeService.removeExchange(ex.id);
      count++;
    })
    this.syncService.forcePortfolioSync(parseInt(req.user.id, 10));
    // just added this temporarily to clear out the exchanges during testing
    return count;
  }

  @Authorize()
  @Post("/add")
  async addExchange(
    @BodyParams() exchange: ExchangeView,
    @Req() req: ReqUser
  ): Promise<Exchange> {
    exchange.userId = parseInt(req.user?.id, 10);

    const existingApiKey = await this.exchangeService.isExistingApiKey(exchange.userId, exchange.apiKey);
    if (existingApiKey) {
      throw new ValidationException(
        nameof<Exchange>("apiKey"),
        ValidationKeyword.exchangeExists,
        "exchange already exists for this user"
      );
    }

    const newExchange = await this.exchangeService.createExchange(exchange)
      .catch((err) => {
        // tslint:disable-next-line:no-console
        $log.error("err", err)

        throw new ValidationException(
          ValidationKeyword.server,
          ValidationKeyword.server,
          'unexpected error. check logs'
        );
      });
    this.exchangeClientFactoryService.addClientToUser(newExchange.userId, newExchange);
    this.syncService.forcePortfolioSync(exchange.userId);
    // userSocketService
    return this.exchangeService.removeSensativeExchangeInfo(newExchange);
  }
}
