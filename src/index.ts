import {$log} from "@tsed/common";
import {PlatformExpress} from "@tsed/platform-express";
import {Server} from "./server";
import express from 'express';
import { PrismaService } from './services/prisma-service';

async function bootstrap() {
  try {
    $log.debug("Start server...");
    const platform = await PlatformExpress.bootstrap(Server, {
      express: {
        app: express()
      }
    });

    await platform.listen();
    $log.debug("Server initialized");
  } catch (er) {
    $log.error(er);
  }
}

PrismaService.getInstance().connect();

bootstrap();