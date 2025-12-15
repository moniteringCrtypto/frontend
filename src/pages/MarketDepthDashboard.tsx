import { useState } from 'react';
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
    <div className="market-depth-dashboard">
      <div className="dashboard-header">
        <h1>매물대 분석 대시보드</h1>
        <p>실시간 거래소별 매물대 비교 및 변화량 추적</p>
      </div>

      <div className="dashboard-controls">
        <div className="control-section">
          <h3>코인 선택</h3>
          <div className="button-group">
            {COINS.map((coin) => (
              <button
                key={coin.symbol}
                onClick={() => toggleCoin(coin.symbol)}
                className={`control-button ${
                  selectedCoins.includes(coin.symbol) ? 'active' : ''
                }`}
              >
                {coin.name}
              </button>
            ))}
          </div>
        </div>

        <div className="control-section">
          <h3>거래소 선택</h3>
          <div className="button-group">
            {EXCHANGES.map((exchange) => (
              <button
                key={exchange}
                onClick={() => toggleExchange(exchange)}
                className={`control-button ${
                  selectedExchanges.includes(exchange) ? 'active' : ''
                }`}
              >
                {exchange}
              </button>
            ))}
            <button
              onClick={() => setShowCombined(!showCombined)}
              className={`control-button ${showCombined ? 'active' : ''}`}
              style={{ marginLeft: '1rem', backgroundColor: showCombined ? '#667eea' : '#f8f9fa' }}
            >
              전체 매물대
            </button>
          </div>
        </div>

        <div className="control-section">
          <h3>통화 선택</h3>
          <div className="button-group">
            <button
              onClick={() => setCurrency('USDT')}
              className={`control-button ${currency === 'USDT' ? 'active' : ''}`}
            >
              USDT (달러)
            </button>
            <button
              onClick={() => setCurrency('KRW')}
              className={`control-button ${currency === 'KRW' ? 'active' : ''}`}
            >
              KRW (원화)
            </button>
          </div>
        </div>
      </div>

      {showCombined && selectedCoins.length > 0 && (
        <div className="combined-charts-section">
          {selectedCoins.map((symbol) => {
            const coin = COINS.find((c) => c.symbol === symbol);
            return (
              <CombinedOrderBookDepthCard
                key={`combined-${symbol}`}
                symbol={symbol}
                coinName={coin?.name || symbol}
                exchanges={selectedExchanges}
                currency={currency}
              />
            );
          })}
        </div>
      )}

      <div className="charts-grid">
        {selectedExchanges.flatMap((exchange) =>
          selectedCoins.map((symbol) => {
            const coin = COINS.find((c) => c.symbol === symbol);
            const key = `${exchange}-${symbol}`;

            return (
              <DepthChartCard
                key={key}
                exchange={exchange}
                symbol={symbol}
                coinName={coin?.name || symbol}
                currency={currency}
              />
            );
          })
        )}
      </div>

      {selectedExchanges.length === 0 || selectedCoins.length === 0 ? (
        <div className="empty-state">
          <p>코인과 거래소를 선택하세요</p>
        </div>
      ) : null}
    </div>
  );
};
