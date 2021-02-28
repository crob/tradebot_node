import { User } from '@prisma/client';
import {Configuration, Inject, PlatformApplication} from "@tsed/common";
import bodyParser from "body-parser";
import compress from "compression";
import cookieParser from "cookie-parser";
import methodOverride from "method-override";
import cookieSession from "cookie-session";
import { ValidationMessagesMiddleware } from './middlewares/validation-messages-middleware';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
const rootDir = __dirname;

@Configuration({
  rootDir,
  port: process.env.PORT || 5000,
  acceptMimes: ["application/json"],
  ajv: { options: { allErrors: true } },
  componentsScan: [
    `${rootDir}/protocols/*{.ts,.js}`,
    `${rootDir}/interceptors/*{.ts,.js}`,
    `${rootDir}/services/*{.ts,.js}`
  ],
  mount: {
    "/api": `${rootDir}/controllers/*.ts`, // using componentScan
  },
  passport: {

    // userInfoModel:
  }
})
export class Server {
  @Inject()
  app: PlatformApplication;

  @Configuration()
  settings: Configuration;

  /**
   * This method let you configure the express middleware required by your application to works.
   * @returns {Server}
   */
  public $beforeRoutesInit(): void | Promise<any> {
    this.app
      .use(cors())
      .use(cookieParser())
      .use(compress({}))
      .use(methodOverride())
      .use(bodyParser.json())
      .use(
        bodyParser.urlencoded({
          extended: true
        })
      )
      .use(
        cookieSession({
          keys: ["mysecretkey"],
          resave: true,
          saveUninitialized: true,
          // maxAge: 36000,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          cookie: {
            path: "/",
            httpOnly: true,
            secure: false,
            maxAge: null
          }
        })
      )
      .use(ValidationMessagesMiddleware);
    }
}