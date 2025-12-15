import { useMarketData } from '../hooks/useMarketData';
import type { Exchange, MarketType } from '../types';

interface RecentTradesProps {
  exchange: Exchange;
  symbol: string;
  marketType?: MarketType;
  limit?: number;
}

export const RecentTrades = ({
  exchange,
  symbol,
  marketType = 'Spot',
  limit = 20
}: RecentTradesProps) => {
  const { data: trades, isLoading, error } = useMarketData.useRecentTrades(
    { exchange, symbol, marketType, limit }
  );

  if (isLoading) {
    return (
      <div className="recent-trades loading">
        <div className="spinner"></div>
        <p>Loading recent trades...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recent-trades error">
        <p>Error loading trades</p>
        <small>{error.message}</small>
      </div>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <div className="recent-trades empty">
        <p>No recent trades available</p>
      </div>
    );
  }

  return (
    <div className="recent-trades">
      <div className="trades-header">
        <h3>Recent Trades - {symbol}</h3>
        <span className="exchange-badge">{exchange}</span>
      </div>

      <div className="trades-content">
        <div className="trades-table-header">
          <span>Time</span>
          <span>Price</span>
          <span>Quantity</span>
          <span>Side</span>
        </div>

        <div className="trades-list">
          {trades.map((trade, index) => {
            const side = trade.isBuyerMaker ? 'sell' : 'buy';
            return (
              <div key={`${trade.timestamp}-${index}`} className={`trade-row ${side}`}>
                <span className="time">
                  {new Date(trade.timestamp).toLocaleTimeString()}
                </span>
                <span className="price">${trade.price.toFixed(2)}</span>
                <span className="quantity">{trade.quantity.toFixed(4)}</span>
                <span className={`side ${side}`}>
                  {side.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
