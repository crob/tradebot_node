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

@Controller("/auth")
@Scope(ProviderScope.SINGLETON)
export class PassportCtrl {
  @Post("/login")
  @Authenticate("login")
  login(
    @Req() req: ReqUser,
    @BodyParams("email") email: string,
    @BodyParams("password") pass: string
  ) {
    // FACADE
    // let { id, password, ...rest } = req.user;
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
