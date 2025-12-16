export type Exchange = 'Binance' | 'Bybit' | 'Upbit';
export type MarketType = 'Spot' | 'Futures';

export interface Ticker {
  exchange: number;
  symbol: string;
  marketType: number;
  timestamp: string;
  lastPrice: number;
  highPrice24h: number;
  lowPrice24h: number;
  volume24h: number;
  quoteVolume24h: number;
  priceChangePercent24h: number;
}

export interface Volume {
  symbol: string;
  volume24h: number;
  quoteVolume24h: number;
  timestamp: string;
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
}

export interface OrderBook {
  exchange: number;
  symbol: string;
  marketType: number;
  timestamp: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

export interface Trade {
  exchange: number;
  symbol: string;
  marketType: number;
  timestamp: string;
  price: number;
  quantity: number;
  isBuyerMaker: boolean;
}

export interface VolumeData {
  timestamp: string;
  volume: number;
  quoteVolume: number;
}

export interface MarketDataParams {
  exchange: Exchange;
  symbol: string;
  marketType?: MarketType;
}

export interface HistoricalParams {
  symbol: string;
  marketType?: MarketType;
  exchange?: Exchange;
  from?: Date;
  to?: Date;
}

// TradingView 관련 타입
export interface TradingViewSymbol {
  symbol: string;
  tradingViewFormat: string;
  exchange: Exchange;
  marketType: MarketType;
  displayName: string;
  baseCurrency: string;
  quoteCurrency: string;
}

export interface SymbolInfo {
  exchange: Exchange;
  symbol: string;
  marketType: MarketType;
  baseCurrency: string;
  quoteCurrency: string;
  displayName: string;
  isActive: boolean;
}

export interface SymbolSearchResult {
  results: TradingViewSymbol[];
  totalCount: number;
  pageSize: number;
  page: number;
}
