import { useEffect, useState } from 'react';
import { Typography, Spin } from 'antd';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useMarketStore } from '../../stores/marketStore';
import { parseOutcomePrices, formatUsd, getProbabilityColor, formatChange } from '../../api/helpers';
import { fetchPriceHistory } from '../../api/clob';
import { getYesTokenId } from '../../api/helpers';

const { Text } = Typography;

interface ComparePoint {
  time: number;
  label: string;
  market1: number;
  market2: number;
}

export default function ComparisonView() {
  const { selectedEvent, selectedMarket, compareEvent } = useMarketStore();
  const [chartData, setChartData] = useState<ComparePoint[]>([]);
  const [loading, setLoading] = useState(false);

  const market1 = selectedMarket;
  const market2 = compareEvent?.markets?.[0];

  useEffect(() => {
    if (!market1 || !market2) return;

    const tokenId1 = getYesTokenId(market1.clobTokenIds);
    const tokenId2 = getYesTokenId(market2.clobTokenIds);
    if (!tokenId1 || !tokenId2) return;

    setLoading(true);
    Promise.all([
      fetchPriceHistory(tokenId1, '1m', 360),
      fetchPriceHistory(tokenId2, '1m', 360),
    ]).then(([h1, h2]) => {
      const allTimes = new Set<number>();
      h1.forEach(p => allTimes.add(p.t));
      h2.forEach(p => allTimes.add(p.t));

      const map1 = new Map(h1.map(p => [p.t, p.c * 100]));
      const map2 = new Map(h2.map(p => [p.t, p.c * 100]));

      const sorted = [...allTimes].sort((a, b) => a - b);
      let last1 = 0, last2 = 0;

      const data: ComparePoint[] = sorted.map(t => {
        const v1 = map1.get(t);
        const v2 = map2.get(t);
        if (v1 !== undefined) last1 = v1;
        if (v2 !== undefined) last2 = v2;
        return {
          time: t,
          label: new Date(t * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          market1: v1 ?? last1,
          market2: v2 ?? last2,
        };
      });

      setChartData(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [market1, market2]);

  if (!selectedEvent || !compareEvent || !market1 || !market2) return null;

  const price1 = parseOutcomePrices(market1.outcomePrices).yes;
  const price2 = parseOutcomePrices(market2.outcomePrices).yes;
  const change1 = market1.oneDayPriceChange ?? 0;
  const change2 = market2.oneDayPriceChange ?? 0;
  const vol1 = parseFloat(market1.volume || '0');
  const vol2 = parseFloat(market2.volume || '0');
  const liq1 = parseFloat(market1.liquidity || '0');
  const liq2 = parseFloat(market2.liquidity || '0');

  // Correlation: % of time both moved in same direction
  let sameDirection = 0;
  let totalMoves = 0;
  for (let i = 1; i < chartData.length; i++) {
    const d1 = chartData[i].market1 - chartData[i - 1].market1;
    const d2 = chartData[i].market2 - chartData[i - 1].market2;
    if (d1 !== 0 || d2 !== 0) {
      totalMoves++;
      if ((d1 >= 0 && d2 >= 0) || (d1 < 0 && d2 < 0)) sameDirection++;
    }
  }
  const correlation = totalMoves > 0 ? (sameDirection / totalMoves) * 100 : 0;

  const name1 = selectedEvent.title.slice(0, 30);
  const name2 = compareEvent.title.slice(0, 30);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '6px 10px',
        background: '#0d0d1a',
        borderBottom: '1px solid #1a1a2e',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <Text style={{ color: '#a855f7', fontSize: 12, fontWeight: 600 }}>
          Comparison Mode
        </Text>
        <button
          onClick={() => useMarketStore.setState({ compareEvent: null })}
          style={{ background: '#1a1a2e', color: '#888', border: 'none', borderRadius: 3, padding: '2px 8px', fontSize: 10, cursor: 'pointer' }}
        >
          Close (Esc)
        </button>
      </div>

      {/* Side-by-side stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', padding: '6px 10px', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        <div>
          <Text style={{ color: '#1668dc', fontSize: 10, display: 'block' }}>{name1}</Text>
          <Text style={{ color: getProbabilityColor(price1), fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>
            {(price1 * 100).toFixed(1)}%
          </Text>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Text style={{ color: '#555', fontSize: 9, display: 'block' }}>VS</Text>
          <Text style={{ color: '#888', fontSize: 10 }}>
            Corr: {correlation.toFixed(0)}%
          </Text>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Text style={{ color: '#a855f7', fontSize: 10, display: 'block' }}>{name2}</Text>
          <Text style={{ color: getProbabilityColor(price2), fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>
            {(price2 * 100).toFixed(1)}%
          </Text>
        </div>
      </div>

      {/* Comparison table */}
      <div style={{ padding: '4px 10px', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        {[
          { label: '24h Change', v1: formatChange(change1 * 100), v2: formatChange(change2 * 100), isChange: true },
          { label: 'Volume', v1: formatUsd(vol1), v2: formatUsd(vol2) },
          { label: 'Liquidity', v1: formatUsd(liq1), v2: formatUsd(liq2) },
        ].map(row => (
          <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 1fr', padding: '1px 0' }}>
            <Text style={{
              color: row.isChange ? (row.v1 as { color: string }).color : '#ccc',
              fontSize: 10, fontFamily: 'monospace',
            }}>
              {row.isChange ? `${(row.v1 as { arrow: string }).arrow} ${(row.v1 as { text: string }).text}` : row.v1 as string}
            </Text>
            <Text style={{ color: '#555', fontSize: 9, textAlign: 'center' }}>{row.label}</Text>
            <Text style={{
              color: row.isChange ? (row.v2 as { color: string }).color : '#ccc',
              fontSize: 10, fontFamily: 'monospace', textAlign: 'right',
            }}>
              {row.isChange ? `${(row.v2 as { arrow: string }).arrow} ${(row.v2 as { text: string }).text}` : row.v2 as string}
            </Text>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ flex: 1, minHeight: 0, background: '#141924' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Spin />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#1e2a3a" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 10 }} interval="preserveStartEnd" minTickGap={50} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 10 }} tickFormatter={(v: number) => `${v}%`} width={35} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0]?.payload as ComparePoint;
                  return (
                    <div style={{ background: '#1a2030', border: '1px solid #2a3a50', borderRadius: 4, padding: '6px 10px', fontSize: 11 }}>
                      <div style={{ color: '#999', marginBottom: 3 }}>{p?.label}</div>
                      <div style={{ color: '#1668dc' }}>{name1}: {p?.market1?.toFixed(1)}%</div>
                      <div style={{ color: '#a855f7' }}>{name2}: {p?.market2?.toFixed(1)}%</div>
                    </div>
                  );
                }}
              />
              <Line type="monotone" dataKey="market1" stroke="#1668dc" strokeWidth={2} dot={false} name={name1} />
              <Line type="monotone" dataKey="market2" stroke="#a855f7" strokeWidth={2} dot={false} name={name2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
