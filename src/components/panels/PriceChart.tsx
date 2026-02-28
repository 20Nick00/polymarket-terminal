import { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, ColorType, type IChartApi, type ISeriesApi, type CandlestickData, type HistogramData, type Time } from 'lightweight-charts';
import { Segmented, Typography, Spin, Empty } from 'antd';
import { useMarketStore } from '../../stores/marketStore';

const { Text } = Typography;

const INTERVALS = [
  { label: '1D', value: '1d', fidelity: 5 },
  { label: '1W', value: '1w', fidelity: 30 },
  { label: '1M', value: '1m', fidelity: 60 },
  { label: '3M', value: '3m', fidelity: 360 },
  { label: 'All', value: 'max', fidelity: 1440 },
];

export default function PriceChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const { priceHistory, priceHistoryLoading, selectedMarket, selectedTokenId, loadPriceHistory } = useMarketStore();
  const [interval, setInterval] = useState('max');

  // Create chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0d0d1a' },
        textColor: '#888',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1a1a2e' },
        horzLines: { color: '#1a1a2e' },
      },
      crosshair: {
        vertLine: { color: '#444', width: 1, style: 3 },
        horzLine: { color: '#444', width: 1, style: 3 },
      },
      rightPriceScale: {
        borderColor: '#333',
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        borderColor: '#333',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a44',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  // Update data
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;

    if (priceHistory.length === 0) {
      candleSeriesRef.current.setData([]);
      volumeSeriesRef.current.setData([]);
      return;
    }

    // Build candlestick data from price history
    const candleData: CandlestickData<Time>[] = [];
    const volumeData: HistogramData<Time>[] = [];

    // Group by time intervals for candlestick formation
    const sorted = [...priceHistory].sort((a, b) => a.t - b.t);

    // Create OHLC bars from sequential price points
    const barSize = getBarSize(interval);
    const bars = new Map<number, { o: number; h: number; l: number; c: number; v: number }>();

    for (const point of sorted) {
      const barTime = Math.floor(point.t / barSize) * barSize;
      const existing = bars.get(barTime);
      if (existing) {
        existing.h = Math.max(existing.h, point.c);
        existing.l = Math.min(existing.l, point.c);
        existing.c = point.c;
        existing.v += point.v;
      } else {
        bars.set(barTime, { o: point.c, h: point.c, l: point.c, c: point.c, v: point.v });
      }
    }

    for (const [time, bar] of bars) {
      candleData.push({
        time: time as Time,
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
      });
      volumeData.push({
        time: time as Time,
        value: bar.v,
        color: bar.c >= bar.o ? '#26a69a44' : '#ef535044',
      });
    }

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);
    chartRef.current?.timeScale().fitContent();
  }, [priceHistory, interval]);

  const handleIntervalChange = (value: string | number) => {
    const val = String(value);
    setInterval(val);
    if (selectedTokenId) {
      loadPriceHistory(selectedTokenId, val);
    }
  };

  const currentPrice = selectedMarket ? (() => {
    try {
      const prices = JSON.parse(selectedMarket.outcomePrices as unknown as string || '[]');
      return (parseFloat(prices[0] || '0') * 100).toFixed(1);
    } catch {
      const prices = selectedMarket.outcomePrices;
      if (Array.isArray(prices) && prices.length > 0) {
        return (parseFloat(prices[0]) * 100).toFixed(1);
      }
      return '0';
    }
  })() : '0';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexShrink: 0 }}>
        <div>
          <Text style={{ color: '#e6e6e6', fontSize: 13, fontWeight: 600 }}>
            {selectedMarket?.question?.slice(0, 60) || 'Select a market'}
          </Text>
          {selectedMarket && (
            <Text style={{ color: parseFloat(currentPrice) >= 50 ? '#52c41a' : '#ff4d4f', fontSize: 18, fontWeight: 700, marginLeft: 12 }}>
              {currentPrice}¢
            </Text>
          )}
        </div>
        <Segmented
          size="small"
          options={INTERVALS.map(i => ({ label: i.label, value: i.value }))}
          value={interval}
          onChange={handleIntervalChange}
          style={{ background: '#1a1a2e' }}
        />
      </div>
      <div ref={containerRef} style={{ flex: 1, minHeight: 0 }}>
        {priceHistoryLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Spin />
          </div>
        )}
        {!priceHistoryLoading && priceHistory.length === 0 && !selectedMarket && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Empty description={<Text style={{ color: '#666' }}>Select a market to view chart</Text>} />
          </div>
        )}
      </div>
    </div>
  );
}

function getBarSize(interval: string): number {
  switch (interval) {
    case '1d': return 300;       // 5 min bars
    case '1w': return 1800;      // 30 min bars
    case '1m': return 3600;      // 1 hour bars
    case '3m': return 21600;     // 6 hour bars
    case 'max': return 86400;    // 1 day bars
    default: return 3600;
  }
}
