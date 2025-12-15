import { useMemo, useState } from 'react';
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
import type { OrderBook, Exchange } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface OrderBookData {
  exchange: Exchange;
  orderBook: OrderBook | undefined;
}

interface CombinedDepthChartProps {
  orderBooksData: OrderBookData[];
  symbol: string;
}

const EXCHANGE_COLORS = {
  Binance: {
    bid: 'rgba(16, 185, 129, 0.8)',
    ask: 'rgba(239, 68, 68, 0.8)',
  },
  Bybit: {
    bid: 'rgba(59, 130, 246, 0.8)',
    ask: 'rgba(249, 115, 22, 0.8)',
  },
  Upbit: {
    bid: 'rgba(168, 85, 247, 0.8)',
    ask: 'rgba(236, 72, 153, 0.8)',
  },
};

export const CombinedDepthChart = ({ orderBooksData, symbol }: CombinedDepthChartProps) => {
  const [spreadInterval, setSpreadInterval] = useState<number>(10); // 가격 간격
  const [breakoutThreshold, setBreakoutThreshold] = useState<number>(100); // 돌파량 기준

  const chartData = useMemo(() => {
    const validOrderBooks = orderBooksData.filter((d) => d.orderBook);
    if (validOrderBooks.length === 0) return null;

    // 모든 거래소의 가격 범위 계산
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    validOrderBooks.forEach(({ orderBook }) => {
      if (!orderBook) return;

      orderBook.bids.forEach((bid) => {
        minPrice = Math.min(minPrice, bid.price);
        maxPrice = Math.max(maxPrice, bid.price);
      });

      orderBook.asks.forEach((ask) => {
        minPrice = Math.min(minPrice, ask.price);
        maxPrice = Math.max(maxPrice, ask.price);
      });
    });

    // 가격대 생성 (spreadInterval 간격으로)
    const priceRanges: number[] = [];
    for (let price = Math.floor(minPrice / spreadInterval) * spreadInterval;
         price <= maxPrice;
         price += spreadInterval) {
      priceRanges.push(price);
    }

    // 각 거래소별 데이터셋 생성
    const datasets: any[] = [];

    validOrderBooks.forEach(({ exchange, orderBook }) => {
      if (!orderBook) return;

      // 매수 데이터 (양수)
      const bidData = priceRanges.map((price) => {
        const bidsInRange = orderBook.bids.filter(
          (bid) => bid.price >= price && bid.price < price + spreadInterval
        );
        const totalQty = bidsInRange.reduce((sum, bid) => sum + bid.quantity, 0);
        return totalQty;
      });

      // 매도 데이터 (음수로 표시)
      const askData = priceRanges.map((price) => {
        const asksInRange = orderBook.asks.filter(
          (ask) => ask.price >= price && ask.price < price + spreadInterval
        );
        const totalQty = asksInRange.reduce((sum, ask) => sum + ask.quantity, 0);
        return -totalQty; // 음수로 반전
      });

      const colors = EXCHANGE_COLORS[exchange];

      datasets.push({
        label: `${exchange} 매수`,
        data: bidData,
        backgroundColor: colors.bid,
        borderColor: colors.bid,
        borderWidth: 1,
      });

      datasets.push({
        label: `${exchange} 매도`,
        data: askData,
        backgroundColor: colors.ask,
        borderColor: colors.ask,
        borderWidth: 1,
      });
    });

    return {
      labels: priceRanges.map((p) => `$${p.toLocaleString()}`),
      datasets,
      priceRanges,
    };
  }, [orderBooksData, spreadInterval]);

  // 통계 계산
  const statistics = useMemo(() => {
    if (!chartData) return null;

    const stats = orderBooksData.map(({ exchange, orderBook }) => {
      if (!orderBook) return null;

      const totalBidQty = orderBook.bids.reduce((sum, bid) => sum + bid.quantity, 0);
      const totalAskQty = orderBook.asks.reduce((sum, ask) => sum + ask.quantity, 0);

      const totalBidValue = orderBook.bids.reduce(
        (sum, bid) => sum + bid.price * bid.quantity,
        0
      );
      const totalAskValue = orderBook.asks.reduce(
        (sum, ask) => sum + ask.price * ask.quantity,
        0
      );

      // 돌파량 계산 (breakoutThreshold 이상인 가격대)
      const breakoutBids = chartData.priceRanges.filter((_, idx) => {
        const dataset = chartData.datasets.find(
          (d) => d.label === `${exchange} 매수`
        );
        return dataset && dataset.data[idx] >= breakoutThreshold;
      }).length;

      const breakoutAsks = chartData.priceRanges.filter((_, idx) => {
        const dataset = chartData.datasets.find(
          (d) => d.label === `${exchange} 매도`
        );
        return dataset && Math.abs(dataset.data[idx]) >= breakoutThreshold;
      }).length;

      return {
        exchange,
        totalBidQty,
        totalAskQty,
        totalBidValue,
        totalAskValue,
        breakoutBids,
        breakoutAsks,
      };
    }).filter((s) => s !== null);

    return stats;
  }, [chartData, orderBooksData, breakoutThreshold]);

  if (!chartData) {
    return (
      <div className="combined-depth-chart loading">
        <div className="spinner"></div>
        <p>Loading combined depth chart...</p>
      </div>
    );
  }

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${symbol} 매물대 비교`,
        font: {
          size: 18,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            const value = Math.abs(context.parsed.x);
            label += value.toFixed(4) + ' BTC';
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: false,
        title: {
          display: true,
          text: 'Quantity (BTC)',
        },
        ticks: {
          callback: function (value: any) {
            return Math.abs(value).toFixed(2);
          },
        },
      },
      y: {
        stacked: false,
        title: {
          display: true,
          text: 'Price Range (USDT)',
        },
      },
    },
  };

  return (
    <div className="combined-depth-chart">
      <div className="chart-controls">
        <div className="control-group">
          <label>
            가격 간격 (Spread Interval):
            <input
              type="number"
              value={spreadInterval}
              onChange={(e) => setSpreadInterval(Number(e.target.value))}
              min="1"
              max="1000"
              step="1"
            />
            <span className="unit">USDT</span>
          </label>
        </div>

        <div className="control-group">
          <label>
            돌파량 기준 (Breakout Threshold):
            <input
              type="number"
              value={breakoutThreshold}
              onChange={(e) => setBreakoutThreshold(Number(e.target.value))}
              min="1"
              max="1000"
              step="1"
            />
            <span className="unit">BTC</span>
          </label>
        </div>
      </div>

      <div className="statistics-panel">
        {statistics?.map((stat) => (
          <div key={stat.exchange} className="exchange-stats">
            <h4>{stat.exchange}</h4>
            <div className="stats-grid">
              <div className="stat-item bid">
                <span className="label">총 매수 물량</span>
                <span className="value">{stat.totalBidQty.toFixed(2)} BTC</span>
                <span className="value-usd">
                  ${(stat.totalBidValue / 1000000).toFixed(2)}M
                </span>
              </div>
              <div className="stat-item ask">
                <span className="label">총 매도 물량</span>
                <span className="value">{stat.totalAskQty.toFixed(2)} BTC</span>
                <span className="value-usd">
                  ${(stat.totalAskValue / 1000000).toFixed(2)}M
                </span>
              </div>
              <div className="stat-item breakout">
                <span className="label">돌파 가능 구간</span>
                <span className="value">
                  매수: {stat.breakoutBids} / 매도: {stat.breakoutAsks}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="chart-container-large">
        <Bar options={options} data={chartData} />
      </div>
    </div>
  );
};
