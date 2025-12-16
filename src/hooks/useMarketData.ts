import { useQuery } from '@tanstack/react-query';
import { marketDataApi } from '../api/marketData';
import { tradingViewApi } from '../api/tradingView';
import type { MarketDataParams, HistoricalParams } from '../types';

export const useMarketData = {
  useTicker: (params: MarketDataParams, options = {}) => {
    return useQuery({
      queryKey: ['ticker', params],
      queryFn: () => marketDataApi.getTicker(params),
      refetchInterval: 5000, // Refetch every 5 seconds
      ...options,
    });
  },

  useVolume: (params: MarketDataParams, options = {}) => {
    return useQuery({
      queryKey: ['volume', params],
      queryFn: () => marketDataApi.getVolume(params),
      refetchInterval: 5000,
      ...options,
    });
  },

  useOrderBook: (
    params: MarketDataParams & { limit?: number },
    options = {}
  ) => {
    return useQuery({
      queryKey: ['orderbook', params],
      queryFn: () => marketDataApi.getOrderBook(params),
      refetchInterval: 2000, // Refetch every 2 seconds for orderbook
      ...options,
    });
  },

  useRecentTrades: (
    params: MarketDataParams & { limit?: number },
    options = {}
  ) => {
    return useQuery({
      queryKey: ['trades', params],
      queryFn: () => marketDataApi.getRecentTrades(params),
      refetchInterval: 3000,
      ...options,
    });
  },

  useHistoricalVolume: (params: HistoricalParams, options = {}) => {
    return useQuery({
      queryKey: ['historical-volume', params],
      queryFn: () => marketDataApi.getHistoricalVolume(params),
      ...options,
    });
  },

  useOrderBookHistory: (params: Required<HistoricalParams>, options = {}) => {
    return useQuery({
      queryKey: ['orderbook-history', params],
      queryFn: () => marketDataApi.getOrderBookHistory(params),
      ...options,
    });
  },
};

// TradingView 관련 훅
export const useTradingViewData = {
  useSearchSymbols: (query: string, exchange?: string, options = {}) => {
    return useQuery({
      queryKey: ['symbols', 'search', query, exchange],
      queryFn: () => tradingViewApi.searchSymbols(query, exchange),
      enabled: query.length > 0,
      staleTime: 60000, // 1분 캐싱
      ...options,
    });
  },

  useTradingViewSymbol: (
    exchange: string,
    symbol: string,
    marketType?: string,
    options = {}
  ) => {
    return useQuery({
      queryKey: ['tradingview-symbol', exchange, symbol, marketType],
      queryFn: () => tradingViewApi.getTradingViewSymbol(exchange, symbol, marketType),
      ...options,
    });
  },

  useAllSymbols: (exchange?: string, marketType?: string, options = {}) => {
    return useQuery({
      queryKey: ['symbols', 'all', exchange, marketType],
      queryFn: () => tradingViewApi.getAllSymbols(exchange, marketType),
      staleTime: 300000, // 5분 캐싱
      ...options,
    });
  },
};
