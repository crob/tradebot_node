import {
  BodyParams,
  Req,
  Post,
  Controller,
  Scope,
  ProviderScope,
  Get
} from "@tsed/common";
import { Authenticate, Authorize } from "@tsed/passport";
import { ReqUser } from "../models/req-user";
import { ExchangeClientFactoryService } from '../services/exchange-apis/exchange-factory.service';
import { ExchangeService } from '../services/exchange.service';

@Controller("/auth")
@Scope(ProviderScope.SINGLETON)
export class PassportCtrl {
  constructor(
    private exchangeClientFactoryService: ExchangeClientFactoryService,
    private exchangeService: ExchangeService
  ) {}

  @Post("/login")
  @Authenticate("login")
  async login(
    @Req() req: ReqUser,
    @BodyParams("email") email: string,
    @BodyParams("password") pass: string
  ) {
    // FACADE
    const id = parseInt(req.user.id, 10);
    const exchanges = await this.exchangeService.getExchangesByUserId(id)
    this.exchangeClientFactoryService.createClients(id, exchanges);
    return req.user;
  }

  @Get("/logout")
  logout(@Req() req: ReqUser) {
    req.logout();
  }

  @Get("/user")
  @Authorize()
  user(
    @Req() req: ReqUser
  ) {

    return req.user;
  }
}
