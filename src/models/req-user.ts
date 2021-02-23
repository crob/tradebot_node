import { Req } from "@tsed/common";

export interface ReqUser extends Req {
  user: any;
  logout: () => {};
}
