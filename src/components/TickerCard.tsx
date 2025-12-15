import { useMarketData } from '../hooks/useMarketData';
import type { Exchange, MarketType } from '../types';

interface TickerCardProps {
  exchange: Exchange;
  symbol: string;
  marketType?: MarketType;
}

export const TickerCard = ({ exchange, symbol, marketType = 'Spot' }: TickerCardProps) => {
  const { data: ticker, isLoading, error } = useMarketData.useTicker({ exchange, symbol, marketType });

  if (isLoading) {
    return (
      <div className="ticker-card loading">
        <div className="spinner"></div>
        <p>Loading {exchange} {symbol}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ticker-card error">
        <p>Error loading {exchange} {symbol}</p>
        <small>{error.message}</small>
      </div>
    );
  }

  if (!ticker) return null;

  const priceChangeColor = ticker.priceChangePercent24h >= 0 ? 'positive' : 'negative';

  return (
    <div className="ticker-card">
      <div className="ticker-header">
        <h3>{symbol}</h3>
        <span className="exchange-badge">{exchange}</span>
      </div>

      <div className="ticker-price">
        <div className="last-price">
          ${ticker.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className={`price-change ${priceChangeColor}`}>
          {ticker.priceChangePercent24h >= 0 ? '+' : ''}
          {ticker.priceChangePercent24h.toFixed(2)}%
        </div>
      </div>

      <div className="ticker-stats">
        <div className="stat">
          <span className="label">24h High</span>
          <span className="value">${ticker.highPrice24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="stat">
          <span className="label">24h Low</span>
          <span className="value">${ticker.lowPrice24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="stat">
          <span className="label">24h Volume</span>
          <span className="value">{ticker.volume24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="stat">
          <span className="label">Quote Volume</span>
          <span className="value">${(ticker.quoteVolume24h / 1000000).toFixed(2)}M</span>
        </div>
      </div>

      <div className="ticker-footer">
        <small>Last updated: {new Date(ticker.timestamp).toLocaleTimeString()}</small>
      </div>
    </div>
  );
};
