import { useState, useEffect } from 'react';
import { CombinedOrderBookDepthChart } from './CombinedOrderBookDepthChart';
import { useMarketData } from '../hooks/useMarketData';
import type { Exchange, OrderBook } from '../types';

interface CombinedOrderBookDepthCardProps {
  symbol: string;
  coinName: string;
  exchanges: Exchange[];
  currency?: 'USDT' | 'KRW';
}

interface OrderBookData {
  exchange: Exchange;
  orderBook: OrderBook | undefined;
}

export const CombinedOrderBookDepthCard = ({
  symbol,
  coinName,
  exchanges,
  currency = 'USDT',
}: CombinedOrderBookDepthCardProps) => {
  // 각 거래소별로 orderbook 데이터 가져오기
  const binanceData = useMarketData.useOrderBook(
    { exchange: 'Binance', symbol, marketType: 'Spot', limit: 50 },
    { enabled: exchanges.includes('Binance') }
  );
  const bybitData = useMarketData.useOrderBook(
    { exchange: 'Bybit', symbol, marketType: 'Spot', limit: 50 },
    { enabled: exchanges.includes('Bybit') }
  );
  const upbitData = useMarketData.useOrderBook(
    { exchange: 'Upbit', symbol, marketType: 'Spot', limit: 50 },
    { enabled: exchanges.includes('Upbit') }
  );

  const [orderBooksData, setOrderBooksData] = useState<OrderBookData[]>([]);

  useEffect(() => {
    const data: OrderBookData[] = [];
    
    if (exchanges.includes('Binance') && binanceData.data) {
      data.push({ exchange: 'Binance', orderBook: binanceData.data });
    }
    if (exchanges.includes('Bybit') && bybitData.data) {
      data.push({ exchange: 'Bybit', orderBook: bybitData.data });
    }
    if (exchanges.includes('Upbit') && upbitData.data) {
      data.push({ exchange: 'Upbit', orderBook: upbitData.data });
    }
    
    setOrderBooksData(data);
  }, [binanceData.data, bybitData.data, upbitData.data, exchanges]);

  const isLoading = exchanges.some((ex) => {
    if (ex === 'Binance') return binanceData.isLoading;
    if (ex === 'Bybit') return bybitData.isLoading;
    if (ex === 'Upbit') return upbitData.isLoading;
    return false;
  });

  const error = binanceData.error || bybitData.error || upbitData.error;

  if (isLoading) {
    return (
      <div className="chart-card combined-card">
        <div className="depth-chart loading">
          <div className="spinner"></div>
          <p>Loading combined depth chart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-card combined-card">
        <div className="depth-chart error">
          <h3>{coinName} - 전체 매물대</h3>
          <p>Error loading combined order book</p>
          <small>{error.message || 'Unknown error occurred'}</small>
        </div>
      </div>
    );
  }

  if (orderBooksData.length === 0) {
    return null;
  }

  return (
    <div className="chart-card combined-card">
      <CombinedOrderBookDepthChart
        orderBooksData={orderBooksData}
        title={`${coinName} - 전체 매물대 (${exchanges.join(', ')})`}
        currency={currency}
        symbol={symbol}
      />
    </div>
  );
};

