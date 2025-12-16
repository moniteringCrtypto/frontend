import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DepthChartCard } from '../components/DepthChartCard';
import { CombinedOrderBookDepthCard } from '../components/CombinedOrderBookDepthCard';
import type { Exchange } from '../types';

interface CoinConfig {
  symbol: string;
  name: string;
}

const EXCHANGES: Exchange[] = ['Binance', 'Bybit', 'Upbit'];
const COINS: CoinConfig[] = [
  { symbol: 'BTCUSDT', name: 'Bitcoin' },
  { symbol: 'ETHUSDT', name: 'Ethereum' },
  { symbol: 'BNBUSDT', name: 'BNB' },
];

type Currency = 'USDT' | 'KRW';

export const MarketDepthDashboard = () => {
  const [selectedCoins, setSelectedCoins] = useState<string[]>(['BTCUSDT']);
  const [selectedExchanges, setSelectedExchanges] = useState<Exchange[]>(['Binance', 'Bybit', 'Upbit']);
  const [showCombined, setShowCombined] = useState<boolean>(true);
  const [currency, setCurrency] = useState<Currency>('USDT');

  const toggleCoin = (symbol: string) => {
    setSelectedCoins((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol]
    );
  };

  const toggleExchange = (exchange: Exchange) => {
    setSelectedExchanges((prev) =>
      prev.includes(exchange)
        ? prev.filter((e) => e !== exchange)
        : [...prev, exchange]
    );
  };

  return (
    <motion.div 
      className="market-depth-dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* 헤더 영역 */}
      <motion.div 
        className="dashboard-header"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="header-content">
          <div>
            <motion.h1
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              매물대 분석 대시보드
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              실시간 거래소별 매물대 비교 및 변화량 추적
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* 컨트롤 영역 - 컴팩트하게 */}
      <motion.div 
        className="dashboard-controls"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="controls-grid">
          <div className="control-group">
            <label>코인</label>
            <div className="button-group">
              {COINS.map((coin, index) => (
                <motion.button
                  key={coin.symbol}
                  onClick={() => toggleCoin(coin.symbol)}
                  className={`control-button ${
                    selectedCoins.includes(coin.symbol) ? 'active' : ''
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  {coin.name}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label>거래소</label>
            <div className="button-group">
              {EXCHANGES.map((exchange, index) => (
                <motion.button
                  key={exchange}
                  onClick={() => toggleExchange(exchange)}
                  className={`control-button ${
                    selectedExchanges.includes(exchange) ? 'active' : ''
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                >
                  {exchange}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label>통화</label>
            <div className="button-group">
              <motion.button
                onClick={() => setCurrency('USDT')}
                className={`control-button ${currency === 'USDT' ? 'active' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                USDT
              </motion.button>
              <motion.button
                onClick={() => setCurrency('KRW')}
                className={`control-button ${currency === 'KRW' ? 'active' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 }}
              >
                KRW
              </motion.button>
            </div>
          </div>

          <div className="control-group">
            <label>보기</label>
            <motion.button
              onClick={() => setShowCombined(!showCombined)}
              className={`control-button toggle-button ${showCombined ? 'active' : ''}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              {showCombined ? '전체 매물대 ON' : '전체 매물대 OFF'}
            </motion.button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showCombined && selectedCoins.length > 0 && (
          <motion.div 
            className="combined-charts-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
          >
            {selectedCoins.map((symbol, index) => {
              const coin = COINS.find((c) => c.symbol === symbol);
              return (
                <motion.div
                  key={`combined-${symbol}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CombinedOrderBookDepthCard
                    symbol={symbol}
                    coinName={coin?.name || symbol}
                    exchanges={selectedExchanges}
                    currency={currency}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="charts-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <AnimatePresence>
          {selectedExchanges.flatMap((exchange, exchangeIndex) =>
            selectedCoins.map((symbol, coinIndex) => {
              const coin = COINS.find((c) => c.symbol === symbol);
              const key = `${exchange}-${symbol}`;
              const index = exchangeIndex * selectedCoins.length + coinIndex;

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  layout
                >
                  <DepthChartCard
                    exchange={exchange}
                    symbol={symbol}
                    coinName={coin?.name || symbol}
                    currency={currency}
                  />
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {(selectedExchanges.length === 0 || selectedCoins.length === 0) && (
          <motion.div 
            className="empty-state"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <p>코인과 거래소를 선택하세요</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
