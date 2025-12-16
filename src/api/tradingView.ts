import { apiClient } from './client';
import type { TradingViewSymbol, SymbolInfo, SymbolSearchResult } from '../types';

export const tradingViewApi = {
  // 모든 심볼 조회
  getAllSymbols: async (exchange?: string, marketType?: string) => {
    const params = new URLSearchParams();
    if (exchange) params.append('exchange', exchange);
    if (marketType) params.append('marketType', marketType);

    const queryString = params.toString();
    const response = await apiClient.get<TradingViewSymbol[]>(
      queryString ? `/symbols?${queryString}` : '/symbols'
    );
    return response.data;
  },

  // 심볼 검색
  searchSymbols: async (query: string, exchange?: string, marketType?: string, page = 1, pageSize = 50) => {
    const params = new URLSearchParams({
      query,
      page: String(page),
      pageSize: String(pageSize)
    });
    if (exchange) params.append('exchange', exchange);
    if (marketType) params.append('marketType', marketType);

    const response = await apiClient.get<SymbolSearchResult>(
      `/symbols/search?${params.toString()}`
    );
    return response.data;
  },

  // TradingView 형식 심볼 조회
  getTradingViewSymbol: async (exchange: string, symbol: string, marketType = 'spot') => {
    const response = await apiClient.get<TradingViewSymbol>(
      `/symbols/${exchange}/${symbol}/tradingview?marketType=${marketType}`
    );
    return response.data;
  },

  // 심볼 상세 정보
  getSymbolInfo: async (exchange: string, symbol: string, marketType = 'spot') => {
    const response = await apiClient.get<SymbolInfo>(
      `/symbols/${exchange}/${symbol}/info?marketType=${marketType}`
    );
    return response.data;
  },
};
