import { useMemo } from 'react';
import { Typography, Empty } from 'antd';
import { useMarketStore } from '../../stores/marketStore';
import { parseOutcomePrices, getProbabilityColor, formatUsd } from '../../api/helpers';
import type { PolymarketEvent } from '../../types/market';

const { Text } = Typography;

interface Signal {
  type: 'momentum' | 'spread' | 'mispricing' | 'new';
  icon: string;
  title: string;
  description: string;
  color: string;
  eventId?: string;
}

export default function SignalsPanel() {
  const { events, selectedEvent, selectEvent } = useMarketStore();

  const signals = useMemo(() => {
    const result: Signal[] = [];

    events.forEach(event => {
      // Price Momentum: >5% change
      event.markets?.forEach(m => {
        const change = m.oneDayPriceChange ?? 0;
        if (Math.abs(change) >= 0.05) {
          const isUp = change > 0;
          result.push({
            type: 'momentum',
            icon: isUp ? '🔥' : '📉',
            title: event.title.slice(0, 50),
            description: `${isUp ? '+' : ''}${(change * 100).toFixed(1)}% in 24h`,
            color: isUp ? '#00d4aa' : '#ff4757',
            eventId: event.id,
          });
        }
      });

      // Large Spread Opportunities: >5¢ spread
      event.markets?.forEach(m => {
        if (m.spread && m.spread > 0.05) {
          result.push({
            type: 'spread',
            icon: '💰',
            title: event.title.slice(0, 50),
            description: `${(m.spread * 100).toFixed(1)}¢ spread — potential arb`,
            color: '#ffd43b',
            eventId: event.id,
          });
        }
      });

      // Mispricing Detection (multi-outcome)
      if (event.markets?.length > 1) {
        const probSum = event.markets.reduce((sum, m) => {
          const { yes } = parseOutcomePrices(m.outcomePrices);
          return sum + yes;
        }, 0);

        if (probSum > 1.05 || probSum < 0.95) {
          result.push({
            type: 'mispricing',
            icon: '⚠️',
            title: event.title.slice(0, 50),
            description: `Probabilities sum to ${(probSum * 100).toFixed(0)}% — possible mispricing`,
            color: probSum > 1.05 ? '#ff6b6b' : '#ffd43b',
            eventId: event.id,
          });
        }
      }

      // New Market Alert: created recently with volume
      if (event.createdAt) {
        const created = new Date(event.createdAt);
        const hoursSinceCreation = (Date.now() - created.getTime()) / 3600000;
        const vol = event.volume || 0;
        if (hoursSinceCreation < 24 && vol > 10000) {
          result.push({
            type: 'new',
            icon: '🆕',
            title: event.title.slice(0, 50),
            description: `New market — ${formatUsd(vol)} volume already`,
            color: '#1668dc',
            eventId: event.id,
          });
        }
      }
    });

    // Sort by type priority: mispricing > momentum > spread > new
    const priority = { mispricing: 0, momentum: 1, spread: 2, new: 3 };
    return result.sort((a, b) => priority[a.type] - priority[b.type]);
  }, [events]);

  if (signals.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <Text style={{ fontSize: 20, marginBottom: 4 }}>📊</Text>
        <Text style={{ color: '#666', fontSize: 11 }}>No signals detected</Text>
        <Text style={{ color: '#555', fontSize: 10 }}>Signals appear when markets show unusual activity</Text>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '4px 6px', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        <Text style={{ color: '#888', fontSize: 10 }}>
          {signals.length} signal{signals.length !== 1 ? 's' : ''} detected
        </Text>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {signals.map((signal, i) => (
          <div
            key={`${signal.type}-${signal.title}-${i}`}
            onClick={() => {
              if (signal.eventId) {
                const ev = events.find(e => e.id === signal.eventId);
                if (ev) selectEvent(ev);
              }
            }}
            style={{
              padding: '6px 8px',
              borderBottom: '1px solid #111128',
              cursor: signal.eventId ? 'pointer' : 'default',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#111128'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <span style={{ fontSize: 12, flexShrink: 0 }}>{signal.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: '#ccc', fontSize: 11, display: 'block' }} ellipsis>
                  {signal.title}
                </Text>
                <Text style={{ color: signal.color, fontSize: 10, fontWeight: 600 }}>
                  {signal.description}
                </Text>
              </div>
              <span style={{
                background: signal.color + '22',
                color: signal.color,
                fontSize: 8,
                padding: '1px 5px',
                borderRadius: 3,
                textTransform: 'uppercase',
                fontWeight: 600,
                flexShrink: 0,
              }}>
                {signal.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
