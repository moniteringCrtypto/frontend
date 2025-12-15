import { useState, useEffect } from 'react';
import { OrderBookDepthChart } from './OrderBookDepthChart';
import { useMarketData } from '../hooks/useMarketData';
import type { Exchange, OrderBook } from '../types';

interface DepthChartCardProps {
  exchange: Exchange;
  symbol: string;
  coinName: string;
  currency?: 'USDT' | 'KRW';
}

interface OrderBookHistory {
  current: OrderBook | undefined;
  previous: OrderBook | undefined;
}

export const DepthChartCard = ({ exchange, symbol, coinName, currency = 'USDT' }: DepthChartCardProps) => {
  const { data: orderBook, isLoading, error } = useMarketData.useOrderBook(
    { exchange, symbol, marketType: 'Spot', limit: 50 },
    { enabled: true }
  );

  const [history, setHistory] = useState<OrderBookHistory>({
    current: undefined,
    previous: undefined,
  });

  useEffect(() => {
    if (orderBook) {
      setHistory((prev) => ({
        previous: prev.current,
        current: orderBook,
      }));
    }
  }, [orderBook]);

  if (isLoading) {
    return (
      <div className="chart-card">
        <div className="depth-chart loading">
          <div className="spinner"></div>
          <p>Loading depth chart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-card">
        <div className="depth-chart error">
          <h3>{coinName} - {exchange}</h3>
          <p>Error loading order book</p>
          <small>{error.message || 'Unknown error occurred'}</small>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <OrderBookDepthChart
        orderBook={history.current}
        title={`${coinName} - ${exchange}`}
        previousOrderBook={history.previous}
        exchange={exchange}
        symbol={symbol}
        currency={currency}
      />
    </div>
  );
};
