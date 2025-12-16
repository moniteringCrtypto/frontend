import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
      <motion.div 
        className="chart-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="depth-chart loading">
          <motion.div 
            className="spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p>Loading depth chart...</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="chart-card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="depth-chart error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h3>{coinName} - {exchange}</h3>
          <p>Error loading order book</p>
          <small>{error.message || 'Unknown error occurred'}</small>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="chart-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -5 }}
      style={{ transition: 'box-shadow 0.3s ease' }}
    >
      <OrderBookDepthChart
        orderBook={history.current}
        title={`${coinName} - ${exchange}`}
        previousOrderBook={history.previous}
        exchange={exchange}
        symbol={symbol}
        currency={currency}
      />
    </motion.div>
  );
};
