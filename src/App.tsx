import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TickerCard } from './components/TickerCard';
import { OrderBookView } from './components/OrderBookView';
import { RecentTrades } from './components/RecentTrades';
import { MarketDepthDashboard } from './pages/MarketDepthDashboard';
import { TradingViewPage } from './pages/TradingViewPage';
import type { Exchange } from './types';
import './App.css';
import './pages/MarketDepthDashboard.css';

const EXCHANGES: Exchange[] = ['Binance', 'Bybit', 'Upbit'];
const DEFAULT_SYMBOL = 'BTCUSDT';

type ViewMode = 'overview' | 'depth' | 'chart';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('depth');
  const [selectedExchange, setSelectedExchange] = useState<Exchange>('Binance');
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [inputSymbol, setInputSymbol] = useState(DEFAULT_SYMBOL);

  const handleSymbolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSymbol(inputSymbol);
  };

  return (
    <div className="app">
      <motion.header
        className="app-header"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Crypto Exchange Monitor
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Real-time cryptocurrency market data from multiple exchanges
        </motion.p>
        <motion.div
          className="view-selector"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.button
            onClick={() => setViewMode('depth')}
            className={`view-button ${viewMode === 'depth' ? 'active' : ''}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            매물대 분석
          </motion.button>
          <motion.button
            onClick={() => setViewMode('chart')}
            className={`view-button ${viewMode === 'chart' ? 'active' : ''}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            📊 차트 분석
          </motion.button>
          <motion.button
            onClick={() => setViewMode('overview')}
            className={`view-button ${viewMode === 'overview' ? 'active' : ''}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            시장 개요
          </motion.button>
        </motion.div>
      </motion.header>
      
      {viewMode === 'overview' ? (
        <>
          <div className="controls">
            <form onSubmit={handleSymbolSubmit} className="symbol-form">
              <input
                type="text"
                value={inputSymbol}
                onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
                placeholder="Enter symbol (e.g., BTCUSDT)"
                className="symbol-input"
              />
              <button type="submit" className="submit-button">
                Update
              </button>
            </form>

            <div className="exchange-selector">
              {EXCHANGES.map((exchange) => (
                <button
                  key={exchange}
                  onClick={() => setSelectedExchange(exchange)}
                  className={`exchange-button ${
                    selectedExchange === exchange ? 'active' : ''
                  }`}
                >
                  {exchange}
                </button>
              ))}
            </div>
          </div>

          <div className="main-content">
            <div className="ticker-section">
              <h2>Market Overview</h2>
              <div className="ticker-grid">
                {EXCHANGES.map((exchange) => (
                  <TickerCard
                    key={exchange}
                    exchange={exchange}
                    symbol={symbol}
                  />
                ))}
              </div>
            </div>

            <div className="market-details">
              <div className="orderbook-section">
                <OrderBookView
                  exchange={selectedExchange}
                  symbol={symbol}
                  limit={20}
                />
              </div>

              <div className="trades-section">
                <RecentTrades
                  exchange={selectedExchange}
                  symbol={symbol}
                  limit={30}
                />
              </div>
            </div>
          </div>

          <footer className="app-footer">
            <p>Powered by Quaternion Crypto Exchange API</p>
          </footer>
        </>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'depth' && (
            <motion.div
              key="depth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <MarketDepthDashboard />
            </motion.div>
          )}
          {viewMode === 'chart' && (
            <motion.div
              key="chart"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <TradingViewPage />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>Crypto Exchange Monitor</h1>
        <p>Real-time cryptocurrency market data from multiple exchanges</p>
        <div className="view-selector">
          <button
            onClick={() => setViewMode('depth')}
            className="view-button"
          >
            매물대 분석
          </button>
          <button
            onClick={() => setViewMode('overview')}
            className="view-button active"
          >
            시장 개요
          </button>
        </div>
      </header>

      <div className="controls">
        <form onSubmit={handleSymbolSubmit} className="symbol-form">
          <input
            type="text"
            value={inputSymbol}
            onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
            placeholder="Enter symbol (e.g., BTCUSDT)"
            className="symbol-input"
          />
          <button type="submit" className="submit-button">
            Update
          </button>
        </form>

        <div className="exchange-selector">
          {EXCHANGES.map((exchange) => (
            <button
              key={exchange}
              onClick={() => setSelectedExchange(exchange)}
              className={`exchange-button ${
                selectedExchange === exchange ? 'active' : ''
              }`}
            >
              {exchange}
            </button>
          ))}
        </div>
      </div>

      <div className="main-content">
        <div className="ticker-section">
          <h2>Market Overview</h2>
          <div className="ticker-grid">
            {EXCHANGES.map((exchange) => (
              <TickerCard
                key={exchange}
                exchange={exchange}
                symbol={symbol}
              />
            ))}
          </div>
        </div>

        <div className="market-details">
          <div className="orderbook-section">
            <OrderBookView
              exchange={selectedExchange}
              symbol={symbol}
              limit={20}
            />
          </div>

          <div className="trades-section">
            <RecentTrades
              exchange={selectedExchange}
              symbol={symbol}
              limit={30}
            />
          </div>
        </div>
      </div>

      <footer className="app-footer">
        <p>Powered by Quaternion Crypto Exchange API</p>
      </footer>
    </div>
  );
}

export default App;
