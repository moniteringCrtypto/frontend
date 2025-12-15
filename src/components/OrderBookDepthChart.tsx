import { useMemo, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import { useMarketData } from '../hooks/useMarketData';
import type { OrderBook } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin
);

type TimeInterval = 'realtime' | '5m' | '10m' | '15m' | '30m' | '1h';

interface OrderBookDepthChartProps {
  orderBook: OrderBook | undefined;
  title: string;
  previousOrderBook?: OrderBook;
  exchange?: string;
  symbol?: string;
  currency?: 'USDT' | 'KRW';
  timeInterval?: TimeInterval;
}

export const OrderBookDepthChart = ({
  orderBook,
  title,
  previousOrderBook,
  exchange,
  symbol,
  currency = 'USDT',
  timeInterval = 'realtime',
}: OrderBookDepthChartProps) => {
  const chartRef = useRef(null);
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>(timeInterval);
  
  // 시간 단위별 과거 데이터 가져오기
  const getTimeRange = (interval: TimeInterval) => {
    const now = new Date();
    let from: Date;

    switch (interval) {
      case '5m':
        from = new Date(now.getTime() - 5 * 60 * 1000);
        break;
      case '10m':
        from = new Date(now.getTime() - 10 * 60 * 1000);
        break;
      case '15m':
        from = new Date(now.getTime() - 15 * 60 * 1000);
        break;
      case '30m':
        from = new Date(now.getTime() - 30 * 60 * 1000);
        break;
      case '1h':
        from = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      default:
        return null;
    }

    return { from, to: now };
  };
  
  const timeRange = getTimeRange(selectedInterval);
  const { data: historicalOrderBooks, isLoading: isLoadingHistory, error: historyError, isError: isHistoryError } = useMarketData.useOrderBookHistory(
    {
      exchange: exchange as any,
      symbol: symbol || 'BTCUSDT',
      marketType: 'Spot',
      from: timeRange?.from || new Date(),
      to: timeRange?.to || new Date(),
    },
    {
      enabled: selectedInterval !== 'realtime' && !!exchange && !!symbol && !!timeRange,
      refetchInterval: false, // 과거 데이터는 자동 갱신 불필요
      onError: (error: any) => {
        console.error('Failed to fetch orderbook history:', error);
      },
      onSuccess: (data: any) => {
        console.log(`Loaded ${data?.length || 0} orderbook snapshots for ${selectedInterval}`, {
          exchange,
          symbol,
          timeRange,
          dataCount: data?.length || 0,
        });
      },
    }
  );
  
  const isUpbit = exchange === 'Upbit';
  const isNonUpbit = exchange === 'Binance' || exchange === 'Bybit';
  
  // 환율 계산을 위해 바이낸스 BTC/USDT 가격 가져오기
  const { data: binanceTicker } = useMarketData.useTicker(
    { exchange: 'Binance', symbol: symbol || 'BTCUSDT', marketType: 'Spot' },
    { enabled: !!symbol && (isUpbit || (isNonUpbit && currency === 'KRW')) }
  );
  
  // KRW/USDT 환율 계산
  const krwToUsdtRate = useMemo(() => {
    if (!binanceTicker || !orderBook) return null;
    
    if (isUpbit) {
      // 업비트: KRW-BTC 가격 / BTC-USDT 가격 = KRW/USDT 환율
      const avgPrice = orderBook.bids.length > 0 && orderBook.asks.length > 0
        ? (orderBook.bids[0].price + orderBook.asks[0].price) / 2
        : orderBook.bids[0]?.price || orderBook.asks[0]?.price || 0;
      
      if (avgPrice === 0 || binanceTicker.lastPrice === 0) return null;
      return avgPrice / binanceTicker.lastPrice;
    } else if (isNonUpbit && currency === 'KRW') {
      // 바이낸스/바이비트를 KRW로 변환: USDT-BTC 가격 * BTC-USDT 가격 = KRW-BTC 가격
      // KRW/USDT 환율 = KRW-BTC 가격 / BTC-USDT 가격
      // 여기서는 업비트의 KRW-BTC 가격을 참조해야 하는데, 간단하게 바이낸스 가격을 기준으로 계산
      // 실제로는 업비트의 KRW-BTC 가격을 가져와야 하지만, 일단 바이낸스 가격으로 근사치 계산
      const avgPrice = orderBook.bids.length > 0 && orderBook.asks.length > 0
        ? (orderBook.bids[0].price + orderBook.asks[0].price) / 2
        : orderBook.bids[0]?.price || orderBook.asks[0]?.price || 0;
      
      if (avgPrice === 0 || binanceTicker.lastPrice === 0) return null;
      // 업비트 KRW-BTC 가격을 가져와야 정확하지만, 일단 바이낸스 가격 * 환율로 근사치 사용
      // 업비트 데이터가 필요하므로 별도로 가져와야 함
      return null; // 나중에 업비트 데이터로 계산
    }
    
    return null;
  }, [isUpbit, isNonUpbit, binanceTicker, orderBook, currency]);
  
  // 업비트 KRW-BTC 가격 가져오기 (바이낸스/바이비트를 KRW로 변환할 때 필요)
  const { data: upbitOrderBook } = useMarketData.useOrderBook(
    { exchange: 'Upbit', symbol: symbol || 'BTCUSDT', marketType: 'Spot', limit: 1 },
    { enabled: isNonUpbit && currency === 'KRW' && !!symbol }
  );
  
  // 현재 시장 가격 가져오기 (수평선 표시용)
  const { data: currentTicker } = useMarketData.useTicker(
    { exchange: exchange as any || 'Binance', symbol: symbol || 'BTCUSDT', marketType: 'Spot' },
    { enabled: !!exchange && !!symbol }
  );
  
  // 최종 환율 계산 (업비트 데이터 포함)
  const finalKrwToUsdtRate = useMemo(() => {
    if (!binanceTicker) return null;
    
    if (isUpbit) {
      return krwToUsdtRate;
    } else if (isNonUpbit && currency === 'KRW' && upbitOrderBook) {
      // 업비트 KRW-BTC 가격 사용
      const upbitAvgPrice = upbitOrderBook.bids.length > 0 && upbitOrderBook.asks.length > 0
        ? (upbitOrderBook.bids[0].price + upbitOrderBook.asks[0].price) / 2
        : upbitOrderBook.bids[0]?.price || upbitOrderBook.asks[0]?.price || 0;
      
      if (upbitAvgPrice === 0 || binanceTicker.lastPrice === 0) return null;
      return upbitAvgPrice / binanceTicker.lastPrice;
    }
    
    return null;
  }, [isUpbit, isNonUpbit, krwToUsdtRate, currency, binanceTicker, upbitOrderBook]);

  // 통화 변환 함수
  const convertPrice = useMemo(() => {
    return (price: number): number => {
      if (currency === 'USDT' && isUpbit && finalKrwToUsdtRate) {
        // 업비트 KRW → USDT 변환
        return price / finalKrwToUsdtRate;
      } else if (currency === 'KRW' && isNonUpbit && finalKrwToUsdtRate) {
        // 바이낸스/바이비트 USDT → KRW 변환
        return price * finalKrwToUsdtRate;
      }
      return price;
    };
  }, [currency, isUpbit, isNonUpbit, finalKrwToUsdtRate]);

  // 시간 단위별 데이터 처리
  const processedOrderBook = useMemo(() => {
    if (selectedInterval === 'realtime') {
      return orderBook;
    }
    
    // 과거 데이터가 로딩 중이거나 없으면 현재 데이터 사용
    if (isLoadingHistory || !historicalOrderBooks || historicalOrderBooks.length === 0) {
      return orderBook;
    }
    
    // 특정 시점의 매물대를 가져오기 위해 타겟 시간 계산
    const targetTime = timeRange?.from || new Date();
    
    // 타겟 시간에 가장 가까운 스냅샷 찾기
    let closestSnapshot: any = null;
    let minTimeDiff = Infinity;
    
    historicalOrderBooks.forEach((ob) => {
      const snapshotTime = new Date(ob.timestamp || (ob as any).Timestamp || 0);
      const timeDiff = Math.abs(snapshotTime.getTime() - targetTime.getTime());
      
      if (timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        closestSnapshot = ob;
      }
    });
    
    // 가장 가까운 스냅샷이 없으면 현재 데이터 사용
    if (!closestSnapshot) {
      return orderBook;
    }
    
    // 백엔드 응답이 PascalCase일 수 있으므로 대소문자 모두 처리
    const bids = closestSnapshot.bids || closestSnapshot.Bids || [];
    const asks = closestSnapshot.asks || closestSnapshot.Asks || [];
    
    // OrderBook 형식으로 변환
    const convertedBids = bids.map((bid: any) => ({
      price: bid.price || bid.Price || 0,
      quantity: bid.quantity || bid.Quantity || 0,
    })).sort((a: any, b: any) => b.price - a.price).slice(0, 50);
    
    const convertedAsks = asks.map((ask: any) => ({
      price: ask.price || ask.Price || 0,
      quantity: ask.quantity || ask.Quantity || 0,
    })).sort((a: any, b: any) => b.price - a.price).slice(0, 50);
    
      return {
      bids: convertedBids,
      asks: convertedAsks,
      timestamp: closestSnapshot.timestamp || closestSnapshot.Timestamp || new Date().toISOString(),
      exchange: orderBook?.exchange || 0,
      symbol: orderBook?.symbol || symbol || '',
      marketType: orderBook?.marketType || 0,
    };
  }, [orderBook, historicalOrderBooks, selectedInterval, isLoadingHistory, symbol, timeRange]);

  const chartData = useMemo(() => {
    if (!processedOrderBook) return null;

    // 매도 호가 정렬 (높은 가격부터 낮은 가격으로, 위에서 아래로)
    const sortedAsks = [...processedOrderBook.asks]
      .sort((a, b) => b.price - a.price)
      .slice(0, 50); // 상위 50개만 표시

    // 매수 호가 정렬 (높은 가격부터 낮은 가격으로, 위에서 아래로)
    const sortedBids = [...processedOrderBook.bids]
      .sort((a, b) => b.price - a.price)
      .slice(0, 50); // 상위 50개만 표시

    // 모든 가격을 하나의 배열로 합치기 (매도 + 매수, 중복 제거 후 정렬)
    const allPriceSet = new Set([
      ...sortedAsks.map((a) => convertPrice(a.price)),
      ...sortedBids.map((b) => convertPrice(b.price)),
    ]);
    const allPrices = Array.from(allPriceSet).sort((a, b) => b - a); // 높은 가격부터

    // 매도 수량 데이터 (음수로 표시하여 왼쪽으로)
    const askQuantities = allPrices.map((convertedPrice) => {
      // 원본 가격 찾기
      const ask = sortedAsks.find((a) => Math.abs(convertPrice(a.price) - convertedPrice) < 0.01);
      return ask ? -ask.quantity : 0; // 음수로 표시
    });

    // 매수 수량 데이터 (양수로 표시하여 오른쪽으로)
    const bidQuantities = allPrices.map((convertedPrice) => {
      // 원본 가격 찾기
      const bid = sortedBids.find((b) => Math.abs(convertPrice(b.price) - convertedPrice) < 0.01);
      return bid ? bid.quantity : 0;
    });

    // 총 물량 계산
    const totalBidVolume = processedOrderBook.bids.reduce((sum: number, bid: { price: number; quantity: number }) => sum + bid.quantity, 0);
    const totalAskVolume = processedOrderBook.asks.reduce((sum: number, ask: { price: number; quantity: number }) => sum + ask.quantity, 0);

    // 가격 레이블 생성
    const priceLabels = allPrices.map((p) => {
      if (currency === 'KRW') {
        return `${p.toLocaleString(undefined, { maximumFractionDigits: 0 })} KRW`;
      } else {
        return `${p.toFixed(2)} USDT`;
      }
    });

    // 현재 시장 가격 계산 (수평선 표시용)
    let currentMarketPrice: number | null = null;
    if (processedOrderBook) {
      if (isUpbit) {
        // 업비트: processedOrderBook에서 직접 KRW 가격 가져오기
        const krwPrice = processedOrderBook.bids[0]?.price || processedOrderBook.asks[0]?.price || 0;
        if (krwPrice > 0) {
          if (currency === 'USDT' && finalKrwToUsdtRate) {
            // KRW → USDT 변환
            currentMarketPrice = krwPrice / finalKrwToUsdtRate;
          } else {
            // KRW 그대로
            currentMarketPrice = krwPrice;
          }
        }
      } else if (isNonUpbit && currentTicker) {
        // 바이낸스/바이비트: ticker에서 USDT 가격 가져오기
        const usdtPrice = currentTicker.lastPrice;
        if (usdtPrice > 0) {
          if (currency === 'KRW' && finalKrwToUsdtRate) {
            // USDT → KRW 변환
            currentMarketPrice = usdtPrice * finalKrwToUsdtRate;
          } else {
            // USDT 그대로
            currentMarketPrice = usdtPrice;
          }
        }
      }
    }

    return {
      labels: priceLabels,
      datasets: [
        {
          label: '매도 (Asks)',
          data: askQuantities,
          backgroundColor: 'rgba(220, 38, 38, 0.95)', // 더 진한 빨간색
          borderColor: 'rgb(185, 28, 28)', // 진한 빨간색 테두리
          borderWidth: 3,
          barThickness: 10,
          maxBarThickness: 14,
        },
        {
          label: '매수 (Bids)',
          data: bidQuantities,
          backgroundColor: 'rgba(5, 150, 105, 0.95)', // 더 진한 초록색
          borderColor: 'rgb(4, 120, 87)', // 진한 초록색 테두리
          borderWidth: 3,
          barThickness: 10,
          maxBarThickness: 14,
        },
      ],
      totalBars: sortedBids.length + sortedAsks.length,
      priceCount: allPrices.length,
      totalBidVolume,
      totalAskVolume,
      krwToUsdtRate: finalKrwToUsdtRate,
      currentMarketPrice,
      allPrices, // 수평선 위치 계산용
    };
  }, [processedOrderBook, isUpbit, isNonUpbit, currency, finalKrwToUsdtRate, convertPrice, currentTicker]);

  // 변화량 계산
  const volumeChange = useMemo(() => {
    if (!chartData || !previousOrderBook) return null;

    const prevBidVolume = previousOrderBook.bids.reduce(
      (sum, bid) => sum + bid.quantity,
      0
    );
    const prevAskVolume = previousOrderBook.asks.reduce(
      (sum, ask) => sum + ask.quantity,
      0
    );

    const bidChange = chartData.totalBidVolume - prevBidVolume;
    const askChange = chartData.totalAskVolume - prevAskVolume;
    const bidChangePercent = (bidChange / prevBidVolume) * 100;
    const askChangePercent = (askChange / prevAskVolume) * 100;

    return {
      bidChange,
      askChange,
      bidChangePercent,
      askChangePercent,
    };
  }, [chartData, previousOrderBook]);

  if (!chartData) {
    return (
      <div className="depth-chart loading">
        <div className="spinner"></div>
        <p>Loading depth chart...</p>
      </div>
    );
  }

  if (selectedInterval !== 'realtime' && isLoadingHistory) {
    return (
      <div className="depth-chart loading">
        <div className="spinner"></div>
        <p>Loading historical data ({selectedInterval})...</p>
      </div>
    );
  }

  if (selectedInterval !== 'realtime' && isHistoryError) {
    return (
      <div className="depth-chart error">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
          <h3>데이터 로딩 오류</h3>
          <p>과거 데이터를 불러오는 중 오류가 발생했습니다 ({selectedInterval})</p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
            {historyError instanceof Error ? historyError.message : '알 수 없는 오류'}
          </p>
          <button
            onClick={() => setSelectedInterval('realtime')}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            실시간으로 전환
          </button>
        </div>
      </div>
    );
  }

  const isMobileDevice = typeof window !== 'undefined' && window.innerWidth <= 768;

  const options = {
    indexAxis: 'y' as const, // 수평 바 차트
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: isMobileDevice ? 10 : 15,
          font: {
            size: isMobileDevice ? 10 : 12,
            weight: 'bold' as const,
          },
        },
      },
      title: {
        display: true,
        text: title,
        font: {
          size: isMobileDevice ? 14 : 18,
          weight: 'bold' as const,
        },
        padding: {
          top: isMobileDevice ? 5 : 10,
          bottom: isMobileDevice ? 10 : 20,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: isMobileDevice ? 8 : 12,
        titleFont: {
          size: isMobileDevice ? 12 : 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: isMobileDevice ? 10 : 12,
        },
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            const value = Math.abs(context.parsed.x);
            label += value.toFixed(4);
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Quantity',
          font: {
            size: isMobileDevice ? 11 : 14,
            weight: 'bold' as const,
          },
        },
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function (value: any) {
            return Math.abs(value).toFixed(2);
          },
          font: {
            size: isMobileDevice ? 9 : 11,
          },
        },
      },
      y: {
        title: {
          display: true,
          text: currency === 'KRW' ? 'Price (KRW)' : 'Price (USDT)',
          font: {
            size: isMobileDevice ? 11 : 14,
            weight: 'bold' as const,
          },
        },
        reverse: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: isMobileDevice 
            ? (currency === 'KRW' ? 15 : 20)
            : (currency === 'KRW' ? 30 : 40),
          font: {
            size: isMobileDevice 
              ? (currency === 'KRW' ? 7 : 8)
              : (currency === 'KRW' ? 9 : 10),
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'y' as const,
      intersect: false,
    },
  };

  return (
    <div className="depth-chart">
      <div className="depth-chart-header">
        <div className="chart-header-row">
        <h3>{title}</h3>
          <div className="time-interval-selector">
            <button
              onClick={() => setSelectedInterval('realtime')}
              className={`interval-button ${selectedInterval === 'realtime' ? 'active' : ''}`}
            >
              실시간
            </button>
            <button
              onClick={() => setSelectedInterval('5m')}
              className={`interval-button ${selectedInterval === '5m' ? 'active' : ''}`}
            >
              5분
            </button>
            <button
              onClick={() => setSelectedInterval('10m')}
              className={`interval-button ${selectedInterval === '10m' ? 'active' : ''}`}
            >
              10분
            </button>
            <button
              onClick={() => setSelectedInterval('15m')}
              className={`interval-button ${selectedInterval === '15m' ? 'active' : ''}`}
            >
              15분
            </button>
            <button
              onClick={() => setSelectedInterval('30m')}
              className={`interval-button ${selectedInterval === '30m' ? 'active' : ''}`}
            >
              30분
            </button>
            <button
              onClick={() => setSelectedInterval('1h')}
              className={`interval-button ${selectedInterval === '1h' ? 'active' : ''}`}
            >
              1시간
            </button>
          </div>
        </div>
        <div className="depth-stats">
          <div className="stat bid">
            <span className="label">총 매수 물량</span>
            <span className="value">{chartData.totalBidVolume.toFixed(4)}</span>
            {currency === 'KRW' && chartData.krwToUsdtRate && isNonUpbit && (
              <span className="sub-label">
                (≈{(chartData.totalBidVolume * (orderBook?.bids[0]?.price || 0) * chartData.krwToUsdtRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} KRW)
              </span>
            )}
            {currency === 'USDT' && chartData.krwToUsdtRate && isUpbit && (
              <span className="sub-label">
                (≈{(chartData.totalBidVolume * (orderBook?.bids[0]?.price || 0) / chartData.krwToUsdtRate).toFixed(2)} USDT)
              </span>
            )}
            {volumeChange && (
              <span
                className={`change ${
                  volumeChange.bidChange >= 0 ? 'positive' : 'negative'
                }`}
              >
                {volumeChange.bidChange >= 0 ? '+' : ''}
                {volumeChange.bidChangePercent.toFixed(2)}%
              </span>
            )}
          </div>
          <div className="stat ask">
            <span className="label">총 매도 물량</span>
            <span className="value">{chartData.totalAskVolume.toFixed(4)}</span>
            {currency === 'KRW' && chartData.krwToUsdtRate && isNonUpbit && (
              <span className="sub-label">
                (≈{(chartData.totalAskVolume * (orderBook?.asks[0]?.price || 0) * chartData.krwToUsdtRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} KRW)
              </span>
            )}
            {currency === 'USDT' && chartData.krwToUsdtRate && isUpbit && (
              <span className="sub-label">
                (≈{(chartData.totalAskVolume * (orderBook?.asks[0]?.price || 0) / chartData.krwToUsdtRate).toFixed(2)} USDT)
              </span>
            )}
            {volumeChange && (
              <span
                className={`change ${
                  volumeChange.askChange >= 0 ? 'positive' : 'negative'
                }`}
              >
                {volumeChange.askChange >= 0 ? '+' : ''}
                {volumeChange.askChangePercent.toFixed(2)}%
              </span>
            )}
          </div>
          <div className="stat bar-count">
            <span className="label">매물대 바 개수</span>
            <span className="value">{chartData.totalBars}개</span>
            <span className="sub-label">({chartData.priceCount} 가격대)</span>
            {chartData.krwToUsdtRate && (
              <span className="sub-label" style={{ marginTop: '0.25rem', display: 'block' }}>
                환율: 1 USDT = {chartData.krwToUsdtRate.toLocaleString(undefined, { maximumFractionDigits: 0 })} KRW
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="chart-container">
        <Bar ref={chartRef} options={options} data={chartData} />
      </div>
    </div>
  );
};
