import { useState, useCallback, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Typography, Spin, Empty } from 'antd';
import { useMarketStore } from '../../stores/marketStore';
import { parseOutcomePrices, getProbabilityColor } from '../../api/helpers';
import { fetchPriceHistory } from '../../api/clob';
import { getYesTokenId } from '../../api/helpers';
import type { PriceHistoryPoint, PolymarketMarket } from '../../types/market';

const { Text } = Typography;

const INTERVALS = [
  { label: '1H', interval: '1h', fidelity: 1 },
  { label: '6H', interval: '6h', fidelity: 5 },
  { label: '1D', interval: '1d', fidelity: 10 },
  { label: '1W', interval: '1w', fidelity: 60 },
  { label: '1M', interval: '1m', fidelity: 360 },
  { label: 'ALL', interval: 'max', fidelity: 720 },
];

// Color palette for overlay lines
const OVERLAY_COLORS = [
  '#1668dc', '#00d4aa', '#ff4757', '#ffd43b', '#a855f7',
  '#ff6b6b', '#51cf66', '#f97316', '#06b6d4', '#ec4899',
];

interface ChartPoint {
  time: number;
  price: number;
  label: string;
  [key: string]: number | string; // for overlay data keys
}

interface PriceChartProps {
  overlayAll?: boolean;
}

export default function PriceChart({ overlayAll = false }: PriceChartProps) {
  const { priceHistory, priceHistoryLoading, selectedMarket, selectedEvent, selectedTokenId, loadPriceHistory } = useMarketStore();
  const [activeInterval, setActiveInterval] = useState('max');
  const [overlayData, setOverlayData] = useState<ChartPoint[]>([]);
  const [overlayLoading, setOverlayLoading] = useState(false);
  const [overlayMarkets, setOverlayMarkets] = useState<{ id: string; label: string; color: string }[]>([]);

  const handleIntervalChange = useCallback((interval: string, fidelity: number) => {
    setActiveInterval(interval);
    if (selectedTokenId) {
      loadPriceHistory(selectedTokenId, interval, fidelity);
    }
  }, [selectedTokenId, loadPriceHistory]);

  // Load overlay data when overlayAll is enabled
  useEffect(() => {
    if (!overlayAll || !selectedEvent || selectedEvent.markets.length <= 1) {
      setOverlayData([]);
      setOverlayMarkets([]);
      return;
    }

    const fidelity = INTERVALS.find(i => i.interval === activeInterval)?.fidelity ?? 720;

    setOverlayLoading(true);
    const markets = selectedEvent.markets;

    Promise.all(
      markets.map(async (m: PolymarketMarket, idx: number) => {
        const tokenId = getYesTokenId(m.clobTokenIds);
        if (!tokenId) return { market: m, history: [] as PriceHistoryPoint[], idx };
        try {
          const history = await fetchPriceHistory(tokenId, activeInterval, fidelity);
          return { market: m, history, idx };
        } catch {
          return { market: m, history: [] as PriceHistoryPoint[], idx };
        }
      })
    ).then(results => {
      // Build combined dataset
      const allTimes = new Set<number>();
      results.forEach(r => r.history.forEach(p => allTimes.add(p.t)));

      const sortedTimes = [...allTimes].sort((a, b) => a - b);

      const mktInfo = results.map((r, i) => ({
        id: r.market.id,
        label: r.market.question?.replace(/^Will\s+/i, '').replace(/\?$/, '').slice(0, 20) || `Outcome ${i + 1}`,
        color: OVERLAY_COLORS[i % OVERLAY_COLORS.length],
        historyMap: new Map(r.history.map(p => [p.t, p.c * 100])),
      }));

      const data: ChartPoint[] = sortedTimes.map(t => {
        const point: ChartPoint = {
          time: t,
          price: 0,
          label: formatTimeLabel(t, activeInterval),
        };
        mktInfo.forEach(m => {
          point[m.id] = m.historyMap.get(t) ?? 0;
        });
        return point;
      });

      // Forward-fill gaps
      mktInfo.forEach(m => {
        let lastVal = 0;
        data.forEach(point => {
          if ((point[m.id] as number) > 0) {
            lastVal = point[m.id] as number;
          } else {
            point[m.id] = lastVal;
          }
        });
      });

      setOverlayData(data);
      setOverlayMarkets(mktInfo.map(m => ({ id: m.id, label: m.label, color: m.color })));
      setOverlayLoading(false);
    });
  }, [overlayAll, selectedEvent, activeInterval]);

  // Build chart data from priceHistory (single market)
  const chartData: ChartPoint[] = priceHistory
    .map(p => ({
      time: p.t,
      price: p.c * 100,
      label: formatTimeLabel(p.t, activeInterval),
    }))
    .sort((a, b) => a.time - b.time);

  const firstPrice = chartData.length > 0 ? chartData[0].price : 0;
  const lastPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : 0;
  const priceChange = lastPrice - firstPrice;
  const isPositive = priceChange >= 0;
  const lineColor = isPositive ? '#00d4aa' : '#ff4757';

  // Get current price from market
  const currentPrice = selectedMarket ? parseOutcomePrices(selectedMarket.outcomePrices).yes * 100 : 0;

  const showOverlay = overlayAll && overlayData.length > 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#141924' }}>
      {/* Interval buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '3px 8px', flexShrink: 0 }}>
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

      {/* Overlay legend */}
      {showOverlay && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '2px 8px', flexShrink: 0 }}>
          {overlayMarkets.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 8, height: 3, background: m.color, borderRadius: 1 }} />
              <Text style={{ color: '#999', fontSize: 9 }}>{m.label}</Text>
            </div>
          ))}
        </div>
      )}

      {/* Chart area */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {(priceHistoryLoading || overlayLoading) && chartData.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Spin />
          </div>
        ) : !selectedMarket ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Empty description={<Text style={{ color: '#666' }}>Select a market to view chart</Text>} />
          </div>
        ) : chartData.length === 0 && !showOverlay ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Text style={{ color: '#666' }}>No price history available</Text>
          </div>
        ) : showOverlay ? (
          // Overlay mode: multiple lines
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={overlayData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
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
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#555', fontSize: 10 }}
                tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                width={40}
              />
              <Tooltip content={<OverlayTooltip markets={overlayMarkets} />} />
              {overlayMarkets.map(m => (
                <Line
                  key={m.id}
                  type="monotone"
                  dataKey={m.id}
                  stroke={m.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 1 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          // Single market area chart
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
    </div>
  );
}

function OverlayTooltip({ active, payload, markets }: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  markets: { id: string; label: string; color: string }[];
}) {
  if (!active || !payload?.length) return null;

  // Get time from the first payload item
  const point = (payload[0] as unknown as { payload: ChartPoint }).payload;
  const date = new Date(point.time * 1000);

  // Sort by value descending
  const sorted = [...payload]
    .filter(p => (p.value as number) > 0)
    .sort((a, b) => (b.value as number) - (a.value as number));

  return (
    <div style={{
      background: '#1a2030',
      border: '1px solid #2a3a50',
      borderRadius: 4,
      padding: '6px 10px',
      fontSize: 11,
      maxWidth: 220,
    }}>
      <div style={{ color: '#999', marginBottom: 4 }}>
        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        {' '}
        {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </div>
      {sorted.map(item => {
        const mkt = markets.find(m => m.id === item.dataKey);
        return (
          <div key={item.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: mkt?.color || item.color, flexShrink: 0 }} />
              <span style={{ color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {mkt?.label || item.dataKey}
              </span>
            </div>
            <span style={{ color: getProbabilityColor((item.value as number) / 100), fontWeight: 700, fontFamily: 'monospace', flexShrink: 0 }}>
              {(item.value as number).toFixed(1)}%
            </span>
          </div>
        );
      })}
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
