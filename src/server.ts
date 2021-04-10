import {Configuration, Inject, PlatformApplication} from "@tsed/common";
import "@tsed/socketio";
import bodyParser from "body-parser";
import compress from "compression";
import cookieParser from "cookie-parser";
import methodOverride from "method-override";
import cookieSession from "cookie-session";
import dotenv from 'dotenv';
import cors from 'cors';


import { ValidationMessagesMiddleware } from './middlewares/validation-messages-middleware';
import { TaskQueueService } from './services/task-queue.service';
import { ServerOptions } from 'socket.io';

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
  },
  socketIO: {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    }
    // path: '/socket'
  } as ServerOptions
})
export class Server {

  constructor(private taskQueueService: TaskQueueService) {}

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
      .use(cors( {
        origin: "*"
      }))
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

      this.taskQueueService.init({
        removeOnSuccess: true,
        redis: {
          host: process.env.REDIS_DB_HOST,
          port: process.env.REDIS_DB_PORT,
          password: process.env.REDIS_DB_PASS
        }
      })
    }
}