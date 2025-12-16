import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTradingViewData } from '../hooks/useMarketData';
import type { TradingViewSymbol, Exchange } from '../types';

interface CoinSearchProps {
  onSelectSymbol: (symbol: TradingViewSymbol) => void;
  selectedExchange?: Exchange;
}

export function CoinSearch({ onSelectSymbol, selectedExchange }: CoinSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // 500ms 디바운싱
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 검색 결과 조회
  const { data: searchResults, isLoading } = useTradingViewData.useSearchSymbols(
    debouncedQuery,
    selectedExchange
  );

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 검색 결과가 있으면 드롭다운 열기
  useEffect(() => {
    if (debouncedQuery && searchResults && searchResults.results.length > 0) {
      setIsOpen(true);
    }
  }, [debouncedQuery, searchResults]);

  const handleSelectSymbol = (symbol: TradingViewSymbol) => {
    onSelectSymbol(symbol);
    setSearchQuery('');
    setIsOpen(false);
  };

  const getExchangeEmoji = (exchange: Exchange) => {
    switch (exchange) {
      case 'Binance':
        return '🟡';
      case 'Bybit':
        return '🟠';
      case 'Upbit':
        return '🔵';
      default:
        return '⚪';
    }
  };

  return (
    <div className="coin-search-container" ref={searchRef}>
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="코인 검색 (예: bitcoin, btc, eth...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (debouncedQuery && searchResults && searchResults.results.length > 0) {
              setIsOpen(true);
            }
          }}
        />
        {isLoading && <span className="loading-indicator">⏳</span>}
      </div>

      <AnimatePresence>
        {isOpen && searchResults && searchResults.results.length > 0 && (
          <motion.div
            className="search-results"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="search-results-header">
              검색 결과 ({searchResults.totalCount}개)
            </div>
            <div className="search-results-list">
              {searchResults.results.map((symbol, index) => (
                <motion.div
                  key={`${symbol.exchange}-${symbol.symbol}-${index}`}
                  className="search-result-item"
                  onClick={() => handleSelectSymbol(symbol)}
                  whileHover={{ backgroundColor: 'var(--bg-secondary)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="result-item-main">
                    <span className="result-exchange">
                      {getExchangeEmoji(symbol.exchange)} {symbol.exchange}
                    </span>
                    <span className="result-symbol">{symbol.baseCurrency}/{symbol.quoteCurrency}</span>
                  </div>
                  <div className="result-item-details">
                    <span className="result-display-name">{symbol.displayName}</span>
                    <span className="result-market-type">{symbol.marketType}</span>
                  </div>
                </motion.div>
              ))}
            </div>
            {searchResults.totalCount > searchResults.results.length && (
              <div className="search-results-footer">
                더 많은 결과가 있습니다. 검색어를 더 구체적으로 입력해보세요.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && debouncedQuery && searchResults && searchResults.results.length === 0 && (
        <div className="search-no-results">
          <p>검색 결과가 없습니다.</p>
          <p className="search-hint">다른 검색어를 시도해보세요.</p>
        </div>
      )}
    </div>
  );
}
