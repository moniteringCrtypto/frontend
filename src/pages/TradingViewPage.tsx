import { useState } from 'react';
import { motion } from 'framer-motion';
import { CoinSearch } from '../components/CoinSearch';
import { TradingViewChart } from '../components/TradingViewChart';
import { useMarketData } from '../hooks/useMarketData';
import type { TradingViewSymbol, Exchange } from '../types';

export function TradingViewPage() {
  const [selectedSymbol, setSelectedSymbol] = useState<TradingViewSymbol | null>(null);
  const [selectedExchange, setSelectedExchange] = useState<Exchange>('Binance');

  // 선택된 코인의 실시간 티커 정보
  const { data: ticker } = useMarketData.useTicker(
    {
      exchange: selectedSymbol?.exchange || 'Binance',
      symbol: selectedSymbol?.symbol || 'BTCUSDT',
      marketType: selectedSymbol?.marketType || 'Spot',
    },
    {
      enabled: !!selectedSymbol,
    }
  );

  const handleSelectSymbol = (symbol: TradingViewSymbol) => {
    setSelectedSymbol(symbol);
    setSelectedExchange(symbol.exchange);
  };

  const exchanges: Exchange[] = ['Binance', 'Bybit', 'Upbit'];

  return (
    <div className="tradingview-page">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>📊 차트 분석</h1>
        <p>코인을 검색하고 TradingView 차트로 분석하세요</p>
      </motion.div>

      <motion.div
        className="search-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="exchange-filter">
          <label>거래소 필터:</label>
          <div className="exchange-buttons">
            <button
              className={!selectedExchange ? 'active' : ''}
              onClick={() => setSelectedExchange(undefined as any)}
            >
              전체
            </button>
            {exchanges.map((exchange) => (
              <button
                key={exchange}
                className={selectedExchange === exchange ? 'active' : ''}
                onClick={() => setSelectedExchange(exchange)}
              >
                {exchange}
              </button>
            ))}
          </div>
        </div>

        <CoinSearch
          onSelectSymbol={handleSelectSymbol}
          selectedExchange={selectedExchange}
        />
      </motion.div>

      {selectedSymbol ? (
        <motion.div
          className="chart-section"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="chart-header">
            <div className="selected-symbol-info">
              <h2>
                {selectedSymbol.baseCurrency}/{selectedSymbol.quoteCurrency}
              </h2>
              <span className="symbol-exchange">
                {selectedSymbol.exchange} · {selectedSymbol.marketType}
              </span>
            </div>
            {ticker && (
              <div className="ticker-info">
                <div className="ticker-price">
                  <span className="price-label">현재가</span>
                  <span className="price-value">
                    ${ticker.lastPrice.toLocaleString()}
                  </span>
                </div>
                <div className={`ticker-change ${ticker.priceChangePercent24h >= 0 ? 'positive' : 'negative'}`}>
                  <span className="change-label">24시간 변동</span>
                  <span className="change-value">
                    {ticker.priceChangePercent24h >= 0 ? '+' : ''}
                    {ticker.priceChangePercent24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          <TradingViewChart
            symbol={selectedSymbol.tradingViewFormat}
            height={600}
            theme="light"
            interval="D"
          />

          <div className="chart-info-panel">
            <div className="info-row">
              <span className="info-label">심볼</span>
              <span className="info-value">{selectedSymbol.symbol}</span>
            </div>
            <div className="info-row">
              <span className="info-label">거래소</span>
              <span className="info-value">{selectedSymbol.exchange}</span>
            </div>
            <div className="info-row">
              <span className="info-label">마켓 타입</span>
              <span className="info-value">{selectedSymbol.marketType}</span>
            </div>
            {ticker && (
              <>
                <div className="info-row">
                  <span className="info-label">24시간 고가</span>
                  <span className="info-value">${ticker.highPrice24h.toLocaleString()}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">24시간 저가</span>
                  <span className="info-value">${ticker.lowPrice24h.toLocaleString()}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">24시간 거래량</span>
                  <span className="info-value">
                    {ticker.volume24h.toLocaleString()} {selectedSymbol.baseCurrency}
                  </span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="empty-state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="empty-state-icon">📈</div>
          <h3>코인을 선택해주세요</h3>
          <p>위의 검색창에서 코인을 검색하고 선택하면 차트가 표시됩니다</p>
        </motion.div>
      )}
    </div>
  );
}
