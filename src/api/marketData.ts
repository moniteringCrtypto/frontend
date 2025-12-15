import { apiClient } from './client';
import type {
  Ticker,
  Volume,
  OrderBook,
  Trade,
  VolumeData,
  MarketDataParams,
  HistoricalParams,
} from '../types';

export const marketDataApi = {
  getTicker: async (params: MarketDataParams): Promise<Ticker> => {
    const { exchange, symbol, marketType = 'Spot' } = params;
    const response = await apiClient.get<Ticker>(
      `/market/${exchange}/${symbol}/ticker`,
      { params: { marketType } }
    );
    return response.data;
  },

  getVolume: async (params: MarketDataParams): Promise<Volume> => {
    const { exchange, symbol, marketType = 'Spot' } = params;
    const response = await apiClient.get<Volume>(
      `/market/${exchange}/${symbol}/volume`,
      { params: { marketType } }
    );
    return response.data;
  },

  getOrderBook: async (
    params: MarketDataParams & { limit?: number }
  ): Promise<OrderBook> => {
    const { exchange, symbol, marketType = 'Spot', limit = 20 } = params;
    const response = await apiClient.get<OrderBook>(
      `/market/${exchange}/${symbol}/orderbook`,
      { params: { marketType, limit } }
    );
    return response.data;
  },

  getRecentTrades: async (
    params: MarketDataParams & { limit?: number }
  ): Promise<Trade[]> => {
    const { exchange, symbol, marketType = 'Spot', limit = 100 } = params;
    const response = await apiClient.get<Trade[]>(
      `/market/${exchange}/${symbol}/trades`,
      { params: { marketType, limit } }
    );
    return response.data;
  },

  getHistoricalVolume: async (
    params: HistoricalParams
  ): Promise<VolumeData[]> => {
    const response = await apiClient.get<VolumeData[]>('/history/volume', {
      params: {
        symbol: params.symbol,
        marketType: params.marketType,
        exchange: params.exchange,
        from: params.from?.toISOString(),
        to: params.to?.toISOString(),
      },
    });
    return response.data;
  },

  getOrderBookHistory: async (
    params: Required<HistoricalParams>
  ): Promise<OrderBook[]> => {
    const response = await apiClient.get<OrderBook[]>('/history/orderbook', {
      params: {
        symbol: params.symbol,
        marketType: params.marketType,
        exchange: params.exchange,
        from: params.from?.toISOString(),
        to: params.to?.toISOString(),
      },
    });
    return response.data;
  },
};
