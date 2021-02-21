import { PrismaClient } from '@prisma/client';

export class PrismaService {
  private static instance: PrismaService;
  connection: PrismaClient;

  static getInstance() {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  connect() {
    if (!this.connection) {
      this.connection = new PrismaClient();
    }
  }
}