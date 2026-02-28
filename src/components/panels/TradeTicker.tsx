import { useEffect } from 'react';
import { Typography, Spin, Empty } from 'antd';
import { useMarketStore } from '../../stores/marketStore';

const { Text } = Typography;

export default function TradeTicker() {
  const { trades, tradesLoading, selectedTokenId, selectedMarket, loadTrades } = useMarketStore();

  // Auto-refresh trades every 10 seconds
  useEffect(() => {
    if (!selectedTokenId) return;
    const timer = window.setInterval(() => {
      loadTrades(selectedTokenId);
    }, 10000);
    return () => clearInterval(timer);
  }, [selectedTokenId, loadTrades]);

  if (!selectedMarket) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description={<Text style={{ color: '#666' }}>Select a market</Text>} />
      </div>
    );
  }

  if (tradesLoading && trades.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="small" />
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#666', fontSize: 11 }}>No recent trades</Text>
      </div>
    );
  }

  const sortedTrades = [...trades]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontSize: 11 }}>
      {/* Header */}
      <div style={{ display: 'flex', padding: '2px 4px', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        <Text style={{ color: '#555', fontSize: 9, width: 50, textTransform: 'uppercase' }}>Time</Text>
        <Text style={{ color: '#555', fontSize: 9, width: 40, textAlign: 'center', textTransform: 'uppercase' }}>Side</Text>
        <Text style={{ color: '#555', fontSize: 9, flex: 1, textAlign: 'right', textTransform: 'uppercase' }}>Price</Text>
        <Text style={{ color: '#555', fontSize: 9, width: 65, textAlign: 'right', textTransform: 'uppercase' }}>Size</Text>
      </div>

      {/* Trade rows */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {sortedTrades.map((trade, i) => {
          const isBuy = trade.side === 'BUY';
          const price = parseFloat(trade.price);
          const size = parseFloat(trade.size);
          const time = formatTradeTime(trade.timestamp);

          return (
            <div
              key={`${trade.id}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '2px 4px',
                borderBottom: '1px solid #111128',
                animation: i === 0 ? 'fadeIn 0.3s ease' : undefined,
              }}
            >
              <Text style={{ color: '#666', fontSize: 10, width: 50, fontFamily: 'monospace' }}>
                {time}
              </Text>
              <div style={{ width: 40, textAlign: 'center' }}>
                <span style={{
                  color: isBuy ? '#00d4aa' : '#ff4757',
                  fontSize: 10,
                  fontWeight: 700,
                }}>
                  {isBuy ? 'BUY' : 'SELL'}
                </span>
              </div>
              <Text style={{
                color: isBuy ? '#00d4aa' : '#ff4757',
                fontSize: 11,
                flex: 1,
                textAlign: 'right',
                fontFamily: 'monospace',
                fontWeight: 600,
              }}>
                {(price * 100).toFixed(1)}¢
              </Text>
              <Text style={{ color: '#999', fontSize: 11, width: 65, textAlign: 'right', fontFamily: 'monospace' }}>
                {fmtSize(size)}
              </Text>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '3px 4px',
        borderTop: '1px solid #1a1a2e',
        background: '#0a0a14',
        flexShrink: 0,
      }}>
        <Text style={{ color: '#888', fontSize: 10 }}>
          {sortedTrades.length} trades
        </Text>
        {tradesLoading && <Text style={{ color: '#555', fontSize: 10 }}>updating...</Text>}
      </div>
    </div>
  );
}

function formatTradeTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'now';
    if (diffMin < 60) return `${diffMin}m`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '--';
  }
}

function fmtSize(size: number): string {
  if (size >= 1_000_000) return `$${(size / 1_000_000).toFixed(1)}M`;
  if (size >= 1_000) return `$${(size / 1_000).toFixed(1)}K`;
  return `$${size.toFixed(0)}`;
}
