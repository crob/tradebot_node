import { ExchangeName } from '@prisma/client';

export interface ExchangeView {
  id?: number;
  name: ExchangeName;
  apiKey: string;
  apiSecret: string;
  apiThird?: string | null;
  lastSyncAt: Date;
  userId: number;
}
