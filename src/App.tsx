import { useState } from 'react';
import { TickerCard } from './components/TickerCard';
import { OrderBookView } from './components/OrderBookView';
import { RecentTrades } from './components/RecentTrades';
import { MarketDepthDashboard } from './pages/MarketDepthDashboard';
import type { Exchange } from './types';
import './App.css';
import './pages/MarketDepthDashboard.css';

const EXCHANGES: Exchange[] = ['Binance', 'Bybit', 'Upbit'];
const DEFAULT_SYMBOL = 'BTCUSDT';

type ViewMode = 'overview' | 'depth';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('depth');
  const [selectedExchange, setSelectedExchange] = useState<Exchange>('Binance');
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [inputSymbol, setInputSymbol] = useState(DEFAULT_SYMBOL);

  const handleSymbolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSymbol(inputSymbol);
  };

  if (viewMode === 'depth') {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Crypto Exchange Monitor</h1>
          <p>Real-time cryptocurrency market data from multiple exchanges</p>
          <div className="view-selector">
            <button
              onClick={() => setViewMode('depth')}
              className="view-button active"
            >
              매물대 분석
            </button>
            <button
              onClick={() => setViewMode('overview')}
              className="view-button"
            >
              시장 개요
            </button>
          </div>
        </header>
        <MarketDepthDashboard />
      </div>
    );
  }

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
