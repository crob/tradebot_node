import { Req } from "@tsed/common";

export interface ReqUser extends Req {
  user: {id: string};
  logout: () => {};
}
