import { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Typography, Spin, Empty } from 'antd';
import { useMarketStore } from '../../stores/marketStore';
import { parseOutcomePrices } from '../../api/helpers';

const { Text } = Typography;

const INTERVALS = [
  { label: '1H', interval: '1h', fidelity: 1 },
  { label: '6H', interval: '6h', fidelity: 5 },
  { label: '1D', interval: '1d', fidelity: 10 },
  { label: '1W', interval: '1w', fidelity: 60 },
  { label: '1M', interval: '1m', fidelity: 360 },
  { label: 'ALL', interval: 'max', fidelity: 720 },
];

interface ChartPoint {
  time: number;
  price: number;
  label: string;
}

export default function PriceChart() {
  const { priceHistory, priceHistoryLoading, selectedMarket, selectedEvent, selectedTokenId, loadPriceHistory } = useMarketStore();
  const [activeInterval, setActiveInterval] = useState('max');

  const handleIntervalChange = useCallback((interval: string, fidelity: number) => {
    setActiveInterval(interval);
    if (selectedTokenId) {
      loadPriceHistory(selectedTokenId, interval, fidelity);
    }
  }, [selectedTokenId, loadPriceHistory]);

  // Build chart data from priceHistory
  const chartData: ChartPoint[] = priceHistory
    .map(p => ({
      time: p.t,
      price: p.c * 100, // convert 0-1 to 0-100 percentage
      label: formatTimeLabel(p.t, activeInterval),
    }))
    .sort((a, b) => a.time - b.time);

  const firstPrice = chartData.length > 0 ? chartData[0].price : 0;
  const lastPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : 0;
  const priceChange = lastPrice - firstPrice;
  const priceChangePct = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;
  const isPositive = priceChange >= 0;
  const lineColor = isPositive ? '#00d4aa' : '#ff4757';

  // Get current price from market
  const currentPrice = selectedMarket ? parseOutcomePrices(selectedMarket.outcomePrices).yes * 100 : 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#141924' }}>
      {/* Header: price info + interval buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '4px 8px', flexShrink: 0 }}>
        <div>
          <Text style={{ color: '#999', fontSize: 11, display: 'block', lineHeight: 1 }}>
            {selectedEvent?.title?.slice(0, 50) || 'Select a market'}
            {selectedMarket && selectedEvent && selectedEvent.markets.length > 1 && (
              <span style={{ color: '#666' }}> — {selectedMarket.question?.slice(0, 30)}</span>
            )}
          </Text>
          {selectedMarket && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: 700, fontFamily: 'monospace' }}>
                {currentPrice.toFixed(1)}%
              </Text>
              <Text style={{ color: lineColor, fontSize: 13, fontWeight: 600 }}>
                {isPositive ? '+' : ''}{priceChange.toFixed(1)}%
              </Text>
              <Text style={{ color: lineColor, fontSize: 11 }}>
                ({isPositive ? '+' : ''}{priceChangePct.toFixed(1)}%)
              </Text>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {INTERVALS.map(iv => (
            <button
              key={iv.interval}
              onClick={() => handleIntervalChange(iv.interval, iv.fidelity)}
              style={{
                background: activeInterval === iv.interval ? '#1668dc' : '#1a2030',
                color: activeInterval === iv.interval ? '#fff' : '#888',
                border: 'none',
                borderRadius: 3,
                padding: '3px 8px',
                fontSize: 10,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {iv.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {priceHistoryLoading && chartData.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Spin />
          </div>
        ) : !selectedMarket ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Empty description={<Text style={{ color: '#666' }}>Select a market to view chart</Text>} />
          </div>
        ) : chartData.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Text style={{ color: '#666' }}>No price history available</Text>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e2a3a" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#555', fontSize: 10 }}
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <YAxis
                domain={['auto', 'auto']}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#555', fontSize: 10 }}
                tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke={lineColor}
                strokeWidth={2}
                fill="url(#priceGradient)"
                dot={false}
                activeDot={{ r: 4, fill: lineColor, stroke: '#141924', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartPoint }> }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const date = new Date(point.time * 1000);
  return (
    <div style={{
      background: '#1a2030',
      border: '1px solid #2a3a50',
      borderRadius: 4,
      padding: '6px 10px',
      fontSize: 11,
    }}>
      <div style={{ color: '#999', marginBottom: 2 }}>
        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        {' '}
        {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: 'monospace' }}>
        {point.price.toFixed(1)}%
      </div>
      <div style={{ color: '#888' }}>
        {point.price.toFixed(1)}¢
      </div>
    </div>
  );
}

function formatTimeLabel(timestamp: number, interval: string): string {
  const date = new Date(timestamp * 1000);
  switch (interval) {
    case '1h':
    case '6h':
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    case '1d':
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    case '1w':
      return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' });
    case '1m':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'max':
    default:
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
