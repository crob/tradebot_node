import { ExchangeType } from '../enums/exchange-type';

export interface BaseExchangeApi {
  client: any;
  type: ExchangeType;
  getBalance(): Promise<any>;
  getTradablePairs(): Promise<any>;
  setTrade(): Promise<any>;
}