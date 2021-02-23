import { IStrategyOptions, Strategy } from 'passport-local';
import { OnInstall, OnVerify, Protocol } from '@tsed/passport';
import { BodyParams, Req } from "@tsed/common";
import { UserService } from "../services/user-service";
import { UserAddView } from '../models/user-add-view';
import { removePasswordField } from '../controllers/users';

@Protocol<IStrategyOptions>({
  name: "login",
  useStrategy: Strategy,
  settings: {
    usernameField: "email",
    passwordField: "password"
  }
})
export class LoginLocalProtocol implements OnVerify, OnInstall {
  constructor(private userService: UserService) {}

  async $onVerify(@Req() request: Req, @BodyParams() credentials: UserAddView) {
    const { email, password } = credentials;

    const user = await this.userService.getUserByEmail(email);

    if (!user) {
      return false;
      // OR throw new NotAuthorized("Wrong credentials")
    }

    if (!this.userService.validPassword(user, password)) {
      return false;
      // OR throw new NotAuthorized("Wrong credentials")
    }

    return removePasswordField(user);
    // return await this.userService.updateLastLogin(user);
  }

  $onInstall(strategy: Strategy): void {
    // intercept the strategy instance to adding extra configuration
  }
}
