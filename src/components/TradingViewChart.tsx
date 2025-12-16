import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface TradingViewChartProps {
  symbol: string; // TradingView 형식 (예: "BINANCE:BTCUSDT")
  height?: number;
  theme?: 'light' | 'dark';
  interval?: string; // 기본값: "D" (일봉)
}

export function TradingViewChart({
  symbol,
  height = 600,
  theme = 'light',
  interval = 'D',
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const widgetRef = useRef<any>(null);

  // TradingView 스크립트 로드
  useEffect(() => {
    if (window.TradingView) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    document.head.appendChild(script);

    return () => {
      // 스크립트는 제거하지 않음 (재사용)
    };
  }, []);

  // 위젯 초기화 및 심볼 변경 시 업데이트
  useEffect(() => {
    if (!isScriptLoaded || !containerRef.current) return;

    // 기존 위젯 제거
    if (widgetRef.current) {
      widgetRef.current.remove();
      widgetRef.current = null;
    }

    // 컨테이너 초기화
    containerRef.current.innerHTML = '';

    // 새 위젯 생성
    try {
      widgetRef.current = new window.TradingView.widget({
        container_id: containerRef.current.id,
        symbol: symbol,
        interval: interval,
        timezone: 'Asia/Seoul',
        theme: theme,
        style: '1',
        locale: 'kr',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        allow_symbol_change: true,
        width: '100%',
        height: height,
        save_image: false,
        hide_top_toolbar: false,
        hide_side_toolbar: false,
        studies: [
          'Volume@tv-basicstudies',
        ],
      });
    } catch (error) {
      console.error('TradingView 위젯 초기화 실패:', error);
    }

    return () => {
      if (widgetRef.current) {
        widgetRef.current.remove();
        widgetRef.current = null;
      }
    };
  }, [symbol, isScriptLoaded, interval, theme, height]);

  return (
    <div className="tradingview-chart-container">
      {!isScriptLoaded && (
        <div className="chart-loading">
          <div className="loading-spinner"></div>
          <p>차트를 불러오는 중...</p>
        </div>
      )}
      <div
        id={`tradingview_${Date.now()}`}
        ref={containerRef}
        style={{ display: isScriptLoaded ? 'block' : 'none' }}
      />
    </div>
  );
}
