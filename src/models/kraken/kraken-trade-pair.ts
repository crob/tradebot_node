export interface KrakenTradePairResponse {
  result: KrakenTradePairMap;
  error: any;
}

export interface KrakenTradePairMap {
  [key: string]: KrakenTradePair;
}

export interface KrakenTradePair {
  altname: string;
  wsname: string;
  aclass_base: string;
  base: string;
  aclass_quote: string;
  quote: string;
  lot: string;
  pair_decimals: number;
  lot_decimals: number;
  lot_multiplier: number;
  leverage_buy: [],
  leverage_sell: [],
  fees: [],
  fees_maker: [],
  fee_volume_currency: string;
  margin_call: number;
  margin_stop: number;
  ordermin: string;
}

/*
ltname: 'XTZUSD',
  wsname: 'XTZ/USD',
  aclass_base: 'currency',
  base: 'XTZ',
  aclass_quote: 'currency',
  quote: 'ZUSD',
  lot: 'unit',
  pair_decimals: 4,
  lot_decimals: 8,
  lot_multiplier: 1,
  leverage_buy: [Array],
  leverage_sell: [Array],
  fees: [Array],
  fees_maker: [Array],
  fee_volume_currency: 'ZUSD',
  margin_call: 80,
  margin_stop: 40,
  ordermin: '3'
  */