import { useQuery } from '@tanstack/react-query';
import { marketDataApi } from '../api/marketData';
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
