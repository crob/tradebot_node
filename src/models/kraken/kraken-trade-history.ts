export interface KrakenTradeHistoryAPIResponse {
  result: KrakenTradeHistoryResponse;
}

export interface KrakenTradeHistoryResponse {
  count: number;
  trades: KrakenTradeHistoryTradesMap;
}

export interface KrakenTradeHistoryTradesMap {
  [key: string]: KrakenTradeHistoryItem;
}

export interface KrakenTradeHistoryItem {
  cost: string;
  fee: string;
  margin: string;
  misc: string;
  ordertxid: string;
  ordertype: KrakenOrderType;
  pair: string;
  postxid: string;
  price: string;
  time: number;
  type: KrakenTradeType;
  vol: string;
}

export enum KrakenOrderType {
  Limit = 'limit',
  Market = 'market'
}

export enum KrakenTradeType {
  Buy = 'buy',
  Sell = 'sell'
}
