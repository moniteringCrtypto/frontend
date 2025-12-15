import { useMarketData } from '../hooks/useMarketData';
import type { Exchange, MarketType } from '../types';

interface OrderBookViewProps {
  exchange: Exchange;
  symbol: string;
  marketType?: MarketType;
  limit?: number;
}

export const OrderBookView = ({
  exchange,
  symbol,
  marketType = 'Spot',
  limit = 20
}: OrderBookViewProps) => {
  const { data: orderBook, isLoading, error } = useMarketData.useOrderBook(
    { exchange, symbol, marketType, limit }
  );

  if (isLoading) {
    return (
      <div className="orderbook-view loading">
        <div className="spinner"></div>
        <p>Loading order book...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orderbook-view error">
        <p>Error loading order book</p>
        <small>{error.message}</small>
      </div>
    );
  }

  if (!orderBook) return null;

  return (
    <div className="orderbook-view">
      <div className="orderbook-header">
        <h3>Order Book - {symbol}</h3>
        <span className="exchange-badge">{exchange}</span>
      </div>

      <div className="orderbook-content">
        <div className="orderbook-section asks">
          <div className="section-header">
            <span>Price</span>
            <span>Quantity</span>
            <span>Total</span>
          </div>
          {orderBook.asks.slice(0, 10).reverse().map((ask, idx) => {
            const total = ask.price * ask.quantity;
            return (
              <div key={`ask-${idx}`} className="orderbook-row ask">
                <span className="price">${ask.price.toFixed(2)}</span>
                <span className="quantity">{ask.quantity.toFixed(4)}</span>
                <span className="total">${total.toFixed(2)}</span>
              </div>
            );
          })}
        </div>

        <div className="spread-indicator">
          <span>Spread</span>
          {orderBook.asks[0] && orderBook.bids[0] && (
            <span className="spread-value">
              ${(orderBook.asks[0].price - orderBook.bids[0].price).toFixed(2)}
            </span>
          )}
        </div>

        <div className="orderbook-section bids">
          <div className="section-header">
            <span>Price</span>
            <span>Quantity</span>
            <span>Total</span>
          </div>
          {orderBook.bids.slice(0, 10).map((bid, idx) => {
            const total = bid.price * bid.quantity;
            return (
              <div key={`bid-${idx}`} className="orderbook-row bid">
                <span className="price">${bid.price.toFixed(2)}</span>
                <span className="quantity">{bid.quantity.toFixed(4)}</span>
                <span className="total">${total.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="orderbook-footer">
        <small>Last updated: {new Date(orderBook.timestamp).toLocaleTimeString()}</small>
      </div>
    </div>
  );
};
