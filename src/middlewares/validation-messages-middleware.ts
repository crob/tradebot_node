import { Res, Middleware, Next, IMiddleware, Err, Req } from "@tsed/common";

@Middleware()
export class ValidationMessagesMiddleware implements IMiddleware {
  use(@Err() error: any, @Req() request: Req, @Res() response: Res): any {
    // console.log("before");
    // tslint:disable-next-line:no-console
    console.log("here!", error);
  }
}
