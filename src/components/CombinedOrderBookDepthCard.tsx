import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
      <motion.div 
        className="chart-card combined-card"
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
          <p>Loading combined depth chart...</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="chart-card combined-card"
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
          <h3>{coinName} - 전체 매물대</h3>
          <p>Error loading combined order book</p>
          <small>{error.message || 'Unknown error occurred'}</small>
        </motion.div>
      </motion.div>
    );
  }

  if (orderBooksData.length === 0) {
    return null;
  }

  return (
    <motion.div 
      className="chart-card combined-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -5 }}
      style={{ transition: 'box-shadow 0.3s ease' }}
    >
      <CombinedOrderBookDepthChart
        orderBooksData={orderBooksData}
        title={`${coinName} - 전체 매물대 (${exchanges.join(', ')})`}
        currency={currency}
        symbol={symbol}
      />
    </motion.div>
  );
};

