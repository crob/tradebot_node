import { Exchange, Prisma } from '@prisma/client';
import { BodyParams, Controller, Delete, Get, Post, Req } from '@tsed/common';
import { ExchangeService } from '../services/exchange.service';
import { ExchangeView } from '../models/views/exchange-view';
import { ReqUser } from '../models/req-user';
import { Authorize } from '@tsed/passport';
import { ValidationException } from '../models/validation-exception';
import { nameof } from '../utils';
import { ValidationKeyword } from '../enums';

@Controller("/exchanges")
export class UserCtl {
  constructor(private readonly exchangeService: ExchangeService) {}

  @Authorize()
  @Get()
  async getExchanges(
    @Req() req: ReqUser
  ): Promise<Exchange[]> {
    const exchanges = await this.exchangeService.getExchangesByUserId(parseInt(req.user.id, 10));
    // users = users.map(removePasswordField);
    return exchanges;
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
        console.log("err", err)

        throw new ValidationException(
          ValidationKeyword.server,
          ValidationKeyword.server,
          'unexpected error. check logs'
        );
      });
    return newExchange;
  }
}
