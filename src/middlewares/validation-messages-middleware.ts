import { Res, Middleware, Next, IMiddleware, Err, Req, $log } from "@tsed/common";

@Middleware()
export class ValidationMessagesMiddleware implements IMiddleware {
  use(@Err() error: any, @Req() request: Req, @Res() response: Res): any {
    $log.error("here!", error);
  }
}
