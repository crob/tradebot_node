import { UserService } from '../services/user-service';
import { ValidationException } from '../models/validation-exception';
import { ValidationKeyword } from '../enums/validation-keyword';
import { BodyParams, Controller, Get, Post } from '@tsed/common';
import { Prisma, User } from '@prisma/client';
import { UserAddView } from '../models/views/user-add-view';
import { nameof } from '../utils';

export const removePasswordField = (user) => {
  delete user.password;
  delete user.salt;
  return user;
}

@Controller("/users")
export class UserCtl {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUsers(): Promise<User[]> {
    let users = await this.userService.getUsers();
    users = users.map(removePasswordField);
    return users;
  }

  @Get('/clear')
  async clearUsers(): Promise<Prisma.BatchPayload> {
    // just added this temporarily to clear out the users created before the encrypted password
    return await this.userService.clearUsers();
  }

  @Post("/add")
  async addUser(@BodyParams() user: UserAddView): Promise<User> {
    const { email, password } = {...user};
    const existingUser = await this.userService.getUserByEmail(email);
    if (existingUser) {
      throw new ValidationException(
        nameof<User>("email"),
        ValidationKeyword.emailExists,
        "Email already exists"
      );
    }
    const newUser = await this.userService.createUser(email, password).catch((err) => {
      throw new ValidationException(
        ValidationKeyword.server,
        ValidationKeyword.server,
        'unexpected error. check logs'
      );
    });
    return removePasswordField(newUser);
  }
}
