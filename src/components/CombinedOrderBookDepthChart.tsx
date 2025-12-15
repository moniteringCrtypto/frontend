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
import type { OrderBook, Exchange } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin
);

interface OrderBookData {
  exchange: Exchange;
  orderBook: OrderBook | undefined;
}

type TimeInterval = 'realtime' | '5m' | '10m' | '15m' | '30m' | '1h';

interface CombinedOrderBookDepthChartProps {
  orderBooksData: OrderBookData[];
  title: string;
  currency?: 'USDT' | 'KRW';
  symbol?: string;
}

const EXCHANGE_COLORS = {
  Binance: {
    bid: 'rgba(240, 185, 11, 0.95)', // 노란색 (매수) - 바이낸스
    ask: 'rgba(251, 146, 60, 0.95)', // 주황색 (매도) - 바이낸스
    bidBorder: 'rgb(217, 119, 6)', // 진한 노란색 테두리
    askBorder: 'rgb(234, 88, 12)', // 진한 주황색 테두리
  },
  Bybit: {
    bid: 'rgba(59, 130, 246, 0.95)', // 파란색 (매수) - 바이비트
    ask: 'rgba(239, 68, 68, 0.95)', // 빨간색 (매도) - 바이비트
    bidBorder: 'rgb(37, 99, 235)', // 진한 파란색 테두리
    askBorder: 'rgb(220, 38, 38)', // 진한 빨간색 테두리
  },
  Upbit: {
    bid: 'rgba(168, 85, 247, 0.95)', // 보라색 (매수) - 업비트
    ask: 'rgba(236, 72, 153, 0.95)', // 핑크색 (매도) - 업비트
    bidBorder: 'rgb(147, 51, 234)', // 진한 보라색 테두리
    askBorder: 'rgb(219, 39, 119)', // 진한 핑크색 테두리
  },
};

export const CombinedOrderBookDepthChart = ({
  orderBooksData,
  title,
  currency = 'USDT',
  symbol,
}: CombinedOrderBookDepthChartProps) => {
  const chartRef = useRef(null);
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>('realtime');

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

  // 각 거래소별 historical data 가져오기
  const binanceData = orderBooksData.find((d) => d.exchange === 'Binance');
  const bybitData = orderBooksData.find((d) => d.exchange === 'Bybit');
  const upbitData = orderBooksData.find((d) => d.exchange === 'Upbit');

  const { data: binanceHistory, isLoading: binanceLoading, error: binanceError } = useMarketData.useOrderBookHistory(
    {
      exchange: 'Binance',
      symbol: symbol || 'BTCUSDT',
      marketType: 'Spot',
      from: timeRange?.from || new Date(),
      to: timeRange?.to || new Date(),
    },
    {
      enabled: selectedInterval !== 'realtime' && !!binanceData && !!symbol && !!timeRange,
      refetchInterval: false,
    }
  );

  const { data: bybitHistory, isLoading: bybitLoading, error: bybitError } = useMarketData.useOrderBookHistory(
    {
      exchange: 'Bybit',
      symbol: symbol || 'BTCUSDT',
      marketType: 'Spot',
      from: timeRange?.from || new Date(),
      to: timeRange?.to || new Date(),
    },
    {
      enabled: selectedInterval !== 'realtime' && !!bybitData && !!symbol && !!timeRange,
      refetchInterval: false,
    }
  );

  const { data: upbitHistory, isLoading: upbitLoading, error: upbitError } = useMarketData.useOrderBookHistory(
    {
      exchange: 'Upbit',
      symbol: symbol || 'BTCUSDT',
      marketType: 'Spot',
      from: timeRange?.from || new Date(),
      to: timeRange?.to || new Date(),
    },
    {
      enabled: selectedInterval !== 'realtime' && !!upbitData && !!symbol && !!timeRange,
      refetchInterval: false,
    }
  );

  const isLoadingHistory = binanceLoading || bybitLoading || upbitLoading;
  const hasHistoryError = binanceError || bybitError || upbitError;

  // 업비트가 포함되어 있는지 확인
  const hasUpbit = orderBooksData.some((d) => d.exchange === 'Upbit' && d.orderBook);
  const hasNonUpbit = orderBooksData.some((d) => (d.exchange === 'Binance' || d.exchange === 'Bybit') && d.orderBook);
  const upbitOrderBook = orderBooksData.find((d) => d.exchange === 'Upbit' && d.orderBook)?.orderBook;
  
  // 환율 계산을 위해 바이낸스 BTC/USDT 가격 가져오기
  const { data: binanceTicker } = useMarketData.useTicker(
    { exchange: 'Binance', symbol: symbol || 'BTCUSDT', marketType: 'Spot' },
    { enabled: (hasUpbit || (hasNonUpbit && currency === 'KRW')) && !!symbol }
  );
  
  // KRW/USDT 환율 계산
  const krwToUsdtRate = useMemo(() => {
    if (!binanceTicker) return null;
    
    if (hasUpbit && upbitOrderBook) {
      // 업비트: KRW-BTC 가격 / BTC-USDT 가격 = KRW/USDT 환율
      const avgPrice = upbitOrderBook.bids.length > 0 && upbitOrderBook.asks.length > 0
        ? (upbitOrderBook.bids[0].price + upbitOrderBook.asks[0].price) / 2
        : upbitOrderBook.bids[0]?.price || upbitOrderBook.asks[0]?.price || 0;
      
      if (avgPrice === 0 || binanceTicker.lastPrice === 0) return null;
      return avgPrice / binanceTicker.lastPrice;
    }
    
    return null;
  }, [hasUpbit, binanceTicker, upbitOrderBook]);

  // 통화 변환 함수
  const convertPrice = useMemo(() => {
    return (price: number, exchange: Exchange): number => {
      if (currency === 'USDT' && exchange === 'Upbit' && krwToUsdtRate) {
        // 업비트 KRW → USDT 변환
        return price / krwToUsdtRate;
      } else if (currency === 'KRW' && (exchange === 'Binance' || exchange === 'Bybit') && krwToUsdtRate) {
        // 바이낸스/바이비트 USDT → KRW 변환
        return price * krwToUsdtRate;
      }
      return price;
    };
  }, [currency, krwToUsdtRate]);

  // Historical data 처리 함수
  const aggregateHistoricalOrderBook = (historicalData: OrderBook[] | undefined, currentOrderBook: OrderBook | undefined): OrderBook | undefined => {
    if (!historicalData || historicalData.length === 0) {
      return currentOrderBook;
    }

    const bidPriceMap = new Map<number, number[]>();
    const askPriceMap = new Map<number, number[]>();

    historicalData.forEach((ob) => {
      ob.bids?.forEach((bid) => {
        const roundedPrice = Math.round(bid.price * 100) / 100;
        if (!bidPriceMap.has(roundedPrice)) {
          bidPriceMap.set(roundedPrice, []);
        }
        bidPriceMap.get(roundedPrice)!.push(bid.quantity);
      });

      ob.asks?.forEach((ask) => {
        const roundedPrice = Math.round(ask.price * 100) / 100;
        if (!askPriceMap.has(roundedPrice)) {
          askPriceMap.set(roundedPrice, []);
        }
        askPriceMap.get(roundedPrice)!.push(ask.quantity);
      });
    });

    const aggregatedBids = Array.from(bidPriceMap.entries())
      .map(([price, quantities]) => ({
        price,
        quantity: quantities.reduce((sum, qty) => sum + qty, 0) / quantities.length,
      }))
      .sort((a, b) => b.price - a.price)
      .slice(0, 50);

    const aggregatedAsks = Array.from(askPriceMap.entries())
      .map(([price, quantities]) => ({
        price,
        quantity: quantities.reduce((sum, qty) => sum + qty, 0) / quantities.length,
      }))
      .sort((a, b) => b.price - a.price)
      .slice(0, 50);

    return {
      bids: aggregatedBids,
      asks: aggregatedAsks,
      timestamp: historicalData[historicalData.length - 1]?.timestamp || new Date().toISOString(),
      exchange: currentOrderBook?.exchange || 0,
      symbol: currentOrderBook?.symbol || symbol || '',
      marketType: currentOrderBook?.marketType || 0,
    };
  };

  // 처리된 orderBooks 데이터
  const processedOrderBooksData = useMemo(() => {
    if (selectedInterval === 'realtime') {
      return orderBooksData;
    }

    return orderBooksData.map((data) => {
      let processedOrderBook: OrderBook | undefined = data.orderBook;

      if (data.exchange === 'Binance' && binanceHistory) {
        processedOrderBook = aggregateHistoricalOrderBook(binanceHistory, data.orderBook);
      } else if (data.exchange === 'Bybit' && bybitHistory) {
        processedOrderBook = aggregateHistoricalOrderBook(bybitHistory, data.orderBook);
      } else if (data.exchange === 'Upbit' && upbitHistory) {
        processedOrderBook = aggregateHistoricalOrderBook(upbitHistory, data.orderBook);
      }

      return {
        ...data,
        orderBook: processedOrderBook,
      };
    });
  }, [selectedInterval, orderBooksData, binanceHistory, bybitHistory, upbitHistory]);

  const chartData = useMemo(() => {
    const validOrderBooks = processedOrderBooksData.filter((d) => d.orderBook);
    if (validOrderBooks.length === 0) return null;

    // 모든 거래소의 가격 수집 (통화 변환 적용)
    // 같은 가격대를 그룹화하기 위해 가격을 반올림하여 키로 사용
    const priceGroups = new Map<number, number>(); // 반올림된 가격(키) -> 대표 가격(값)
    
    validOrderBooks.forEach(({ exchange, orderBook }) => {
      if (!orderBook) return;
      orderBook.bids.forEach((bid) => {
        const convertedPrice = convertPrice(bid.price, exchange);
        // 가격을 소수점 2자리로 반올림하여 같은 가격대로 그룹화
        const roundedKey = Math.round(convertedPrice * 100) / 100;
        // 같은 키가 없거나, 더 가까운 가격이면 업데이트
        if (!priceGroups.has(roundedKey) || 
            Math.abs(priceGroups.get(roundedKey)! - convertedPrice) > Math.abs(roundedKey - convertedPrice)) {
          priceGroups.set(roundedKey, convertedPrice);
        }
      });
      orderBook.asks.forEach((ask) => {
        const convertedPrice = convertPrice(ask.price, exchange);
        // 가격을 소수점 2자리로 반올림하여 같은 가격대로 그룹화
        const roundedKey = Math.round(convertedPrice * 100) / 100;
        // 같은 키가 없거나, 더 가까운 가격이면 업데이트
        if (!priceGroups.has(roundedKey) || 
            Math.abs(priceGroups.get(roundedKey)! - convertedPrice) > Math.abs(roundedKey - convertedPrice)) {
          priceGroups.set(roundedKey, convertedPrice);
        }
      });
    });

    // 가격 정렬 (높은 가격부터) - 반올림된 키를 기준으로 정렬
    const sortedKeys = Array.from(priceGroups.keys()).sort((a, b) => b - a);
    const allPrices = sortedKeys.map(key => priceGroups.get(key)!);

    // 각 가격대별로 모든 거래소의 데이터를 집계하여 스택형 바 생성
    const askDatasets: any[] = [];
    const bidDatasets: any[] = [];

    // 각 거래소별로 데이터 준비
    const exchangeDataMap = new Map<Exchange, { askQuantities: number[], bidQuantities: number[] }>();

    validOrderBooks.forEach(({ exchange, orderBook }) => {
      if (!orderBook) return;

      // 매도 데이터 (음수로 표시하여 왼쪽으로)
      // 각 가격대별로 해당 거래소의 수량 찾기
      const askQuantities = sortedKeys.map((roundedKey) => {
        const ask = orderBook.asks.find((a) => {
          const convertedAskPrice = convertPrice(a.price, exchange);
          const roundedAskPrice = Math.round(convertedAskPrice * 100) / 100;
          // 반올림된 가격이 같으면 같은 가격대로 간주
          return roundedAskPrice === roundedKey;
        });
        return ask ? -ask.quantity : 0;
      });

      // 매수 데이터 (양수로 표시하여 오른쪽으로)
      const bidQuantities = sortedKeys.map((roundedKey) => {
        const bid = orderBook.bids.find((b) => {
          const convertedBidPrice = convertPrice(b.price, exchange);
          const roundedBidPrice = Math.round(convertedBidPrice * 100) / 100;
          // 반올림된 가격이 같으면 같은 가격대로 간주
          return roundedBidPrice === roundedKey;
        });
        return bid ? bid.quantity : 0;
      });

      exchangeDataMap.set(exchange, { askQuantities, bidQuantities });
    });

    // 각 거래소별로 데이터셋 생성 (스택형으로 합치기 위해)
    validOrderBooks.forEach(({ exchange }) => {
      const data = exchangeDataMap.get(exchange);
      if (!data) return;

      const colors = EXCHANGE_COLORS[exchange];

      // 매도 바 (왼쪽) - 스택형으로 합치기
      askDatasets.push({
        label: `${exchange} 매도`,
        data: data.askQuantities,
        backgroundColor: colors.ask,
        borderColor: colors.askBorder,
        borderWidth: 2,
        barThickness: 8,
        maxBarThickness: 12,
        stack: 'asks', // 같은 가격대의 매도 바들을 합치기
      });

      // 매수 바 (오른쪽) - 스택형으로 합치기
      bidDatasets.push({
        label: `${exchange} 매수`,
        data: data.bidQuantities,
        backgroundColor: colors.bid,
        borderColor: colors.bidBorder,
        borderWidth: 2,
        barThickness: 8,
        maxBarThickness: 12,
        stack: 'bids', // 같은 가격대의 매수 바들을 합치기
      });
    });

    // 매도 데이터셋을 먼저, 그 다음 매수 데이터셋을 추가하여 스택이 제대로 작동하도록 함
    const datasets = [...askDatasets, ...bidDatasets];

    // 총 물량 계산
    let totalBidVolume = 0;
    let totalAskVolume = 0;
    let totalBars = 0;

    validOrderBooks.forEach(({ orderBook }) => {
      if (!orderBook) return;
      totalBidVolume += orderBook.bids.reduce((sum, bid) => sum + bid.quantity, 0);
      totalAskVolume += orderBook.asks.reduce((sum, ask) => sum + ask.quantity, 0);
      totalBars += orderBook.bids.length + orderBook.asks.length;
    });

    // 가격 레이블 생성
    const priceLabels = allPrices.map((p) => {
      if (currency === 'KRW') {
        return `${p.toLocaleString(undefined, { maximumFractionDigits: 0 })} KRW`;
      } else {
        return `${p.toFixed(2)} USDT`;
      }
    });

    // 현재 시장 가격 계산 (평균 가격 사용)
    let currentMarketPrice: number | null = null;
    if (validOrderBooks.length > 0 && allPrices.length > 0) {
      // 모든 거래소의 평균 가격 계산
      let totalPrice = 0;
      let count = 0;
      
      validOrderBooks.forEach(({ exchange, orderBook }) => {
        if (!orderBook) return;
        const bidPrice = orderBook.bids[0]?.price || 0;
        const askPrice = orderBook.asks[0]?.price || 0;
        if (bidPrice > 0 && askPrice > 0) {
          const avgPrice = (bidPrice + askPrice) / 2;
          const convertedPrice = convertPrice(avgPrice, exchange);
          totalPrice += convertedPrice;
          count++;
        }
      });
      
      if (count > 0) {
        currentMarketPrice = totalPrice / count;
      }
    }

    return {
      labels: priceLabels,
      datasets,
      totalBidVolume,
      totalAskVolume,
      totalBars,
      priceCount: allPrices.length,
      krwToUsdtRate,
      currentMarketPrice,
      allPrices,
    };
  }, [processedOrderBooksData, hasUpbit, currency, krwToUsdtRate, convertPrice]);

  if (!chartData) {
    return (
      <div className="depth-chart loading">
        <div className="spinner"></div>
        <p>Loading combined depth chart...</p>
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

  if (selectedInterval !== 'realtime' && hasHistoryError) {
    return (
      <div className="depth-chart error">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
          <h3>데이터 로딩 오류</h3>
          <p>과거 데이터를 불러오는 중 오류가 발생했습니다 ({selectedInterval})</p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
            {binanceError && `Binance: ${binanceError instanceof Error ? binanceError.message : '오류'}`}
            {bybitError && ` / Bybit: ${bybitError instanceof Error ? bybitError.message : '오류'}`}
            {upbitError && ` / Upbit: ${upbitError instanceof Error ? upbitError.message : '오류'}`}
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
    indexAxis: 'y' as const,
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
            
            // 같은 가격대의 총합 표시
            if (context.datasetIndex === context.dataset.data.length - 1 || 
                (context.dataset.stack === 'asks' && context.datasetIndex === context.chart.data.datasets.filter((d: any) => d.stack === 'asks').length - 1) ||
                (context.dataset.stack === 'bids' && context.datasetIndex === context.chart.data.datasets.filter((d: any) => d.stack === 'bids').length - 1)) {
              const stack = context.dataset.stack;
              const datasets = context.chart.data.datasets.filter((d: any) => d.stack === stack);
              const total = datasets.reduce((sum: number, d: any) => {
                const val = d.data[context.dataIndex];
                return sum + Math.abs(val || 0);
              }, 0);
              if (total > 0) {
                label += ` (총합: ${total.toFixed(4)})`;
              }
            }
            
            return label;
          },
          footer: function (tooltipItems: any[]) {
            // 같은 가격대의 모든 거래소 합계 표시
            const asksItems = tooltipItems.filter((item: any) => item.dataset.stack === 'asks');
            const bidsItems = tooltipItems.filter((item: any) => item.dataset.stack === 'bids');
            
            const asksTotal = asksItems.reduce((sum: number, item: any) => sum + Math.abs(item.parsed.x || 0), 0);
            const bidsTotal = bidsItems.reduce((sum: number, item: any) => sum + Math.abs(item.parsed.x || 0), 0);
            
            const footer: string[] = [];
            if (asksTotal > 0) {
              footer.push(`매도 총합: ${asksTotal.toFixed(4)}`);
            }
            if (bidsTotal > 0) {
              footer.push(`매수 총합: ${bidsTotal.toFixed(4)}`);
            }
            return footer;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true, // 스택형 바 활성화
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
    <div className="depth-chart combined">
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
          <div className="stat combined-bid">
            <span className="label">총 매수 물량</span>
            <span className="value">{chartData.totalBidVolume.toFixed(4)}</span>
          </div>
          <div className="stat combined-ask">
            <span className="label">총 매도 물량</span>
            <span className="value">{chartData.totalAskVolume.toFixed(4)}</span>
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
      <div className="exchange-legend">
        <div className="legend-item">
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="legend-color" style={{ backgroundColor: EXCHANGE_COLORS.Binance.bid, borderColor: EXCHANGE_COLORS.Binance.bidBorder }}></span>
            <span className="legend-color" style={{ backgroundColor: EXCHANGE_COLORS.Binance.ask, borderColor: EXCHANGE_COLORS.Binance.askBorder }}></span>
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Binance</span>
        </div>
        <div className="legend-item">
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="legend-color" style={{ backgroundColor: EXCHANGE_COLORS.Bybit.bid, borderColor: EXCHANGE_COLORS.Bybit.bidBorder }}></span>
            <span className="legend-color" style={{ backgroundColor: EXCHANGE_COLORS.Bybit.ask, borderColor: EXCHANGE_COLORS.Bybit.askBorder }}></span>
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Bybit</span>
        </div>
        <div className="legend-item">
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="legend-color" style={{ backgroundColor: EXCHANGE_COLORS.Upbit.bid, borderColor: EXCHANGE_COLORS.Upbit.bidBorder }}></span>
            <span className="legend-color" style={{ backgroundColor: EXCHANGE_COLORS.Upbit.ask, borderColor: EXCHANGE_COLORS.Upbit.askBorder }}></span>
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Upbit</span>
        </div>
      </div>
    </div>
  );
};

