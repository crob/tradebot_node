import { User } from '@prisma/client';
import { PrismaService } from './prisma-service';
import crypto from 'crypto';

export class UserService {
  private static instance: UserService;

  static getInstance() {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async getUsers(): Promise<User[]>  {
    return await PrismaService.getInstance().connection.user.findMany();
  }

  async getUserByEmail(email) {
    return await PrismaService.getInstance().connection.user.findUnique({
      where: {
        email
      }
    });
  }

  async clearUsers() {
    return await PrismaService.getInstance().connection.user.deleteMany({where: {salt: ""}});
  }

  private encryptPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = this.hashPassword(salt, password);
    return {salt, hashedPassword};
  }

  private hashPassword(salt, password) {
    return crypto.pbkdf2Sync(password, salt, 10000, 512, 'sha512').toString('hex');
  }

  validPassword(user: User, passwordToVerify) {
    return user.password === this.hashPassword(user.salt, passwordToVerify);
  };

  async createUser(email, password): Promise<User>  {
    const {salt, hashedPassword} = this.encryptPassword(password);
    return await PrismaService.getInstance().connection.user.create({
      data: {
        email,
        salt,
        password: hashedPassword
      }
    }).catch((err) => {
      throw new Error(err);
    });
  }
}