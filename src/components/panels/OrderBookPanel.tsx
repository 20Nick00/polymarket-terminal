import { useEffect } from 'react';
import { Typography, Spin, Empty } from 'antd';
import { useMarketStore } from '../../stores/marketStore';

const { Text } = Typography;

const MAX_LEVELS = 12;

export default function OrderBookPanel() {
  const { orderBook, orderBookLoading, selectedTokenId, loadOrderBook, selectedMarket } = useMarketStore();

  // Auto-refresh order book every 5 seconds
  useEffect(() => {
    if (!selectedTokenId) return;
    const timer = window.setInterval(() => {
      loadOrderBook(selectedTokenId);
    }, 5000);
    return () => clearInterval(timer);
  }, [selectedTokenId, loadOrderBook]);

  if (!selectedMarket) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description={<Text style={{ color: '#666' }}>Select a market</Text>} />
      </div>
    );
  }

  if (orderBookLoading && !orderBook) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="small" />
      </div>
    );
  }

  // Sort bids descending (best bid first), asks ascending (best ask first)
  const rawBids = (orderBook?.bids ?? [])
    .map(b => ({ price: parseFloat(b.price), size: parseFloat(b.size) }))
    .filter(b => b.price > 0 && b.price < 1)
    .sort((a, b) => b.price - a.price)
    .slice(0, MAX_LEVELS);

  const rawAsks = (orderBook?.asks ?? [])
    .map(a => ({ price: parseFloat(a.price), size: parseFloat(a.size) }))
    .filter(a => a.price > 0 && a.price < 1)
    .sort((a, b) => a.price - b.price)
    .slice(0, MAX_LEVELS);

  const maxSize = Math.max(
    ...rawBids.map(b => b.size),
    ...rawAsks.map(a => a.size),
    1,
  );

  const bestBid = rawBids.length > 0 ? rawBids[0].price : 0;
  const bestAsk = rawAsks.length > 0 ? rawAsks[0].price : 0;
  const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0;
  const midpoint = bestBid > 0 && bestAsk > 0 ? (bestBid + bestAsk) / 2 : bestBid || bestAsk;

  const totalBidDepth = rawBids.reduce((s, b) => s + b.size, 0);
  const totalAskDepth = rawAsks.reduce((s, a) => s + a.size, 0);

  const fmtSize = (s: number) =>
    s >= 1_000_000 ? `${(s / 1_000_000).toFixed(1)}M`
      : s >= 1_000 ? `${(s / 1_000).toFixed(1)}K`
        : s.toFixed(0);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontSize: 11 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, padding: '0 4px' }}>
        <Text style={{ color: '#888', fontSize: 10, textTransform: 'uppercase' }}>Price</Text>
        <Text style={{ color: '#888', fontSize: 10, textTransform: 'uppercase' }}>Size</Text>
      </div>

      {/* Asks (reversed so cheapest at bottom, near spread) */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {[...rawAsks].reverse().map((ask, i) => {
          const pct = (ask.size / maxSize) * 100;
          return (
            <div key={`ask-${i}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 4px', position: 'relative', cursor: 'pointer' }}>
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${pct}%`, background: 'rgba(255, 71, 87, 0.10)' }} />
              <Text style={{ color: '#ff4757', fontSize: 11, zIndex: 1, fontFamily: 'monospace' }}>
                {(ask.price * 100).toFixed(1)}¢
              </Text>
              <Text style={{ color: '#999', fontSize: 11, zIndex: 1, fontFamily: 'monospace' }}>
                {fmtSize(ask.size)}
              </Text>
            </div>
          );
        })}
      </div>

      {/* Spread / Midpoint */}
      <div style={{
        textAlign: 'center',
        padding: '4px 0',
        borderTop: '1px solid #1a1a2e',
        borderBottom: '1px solid #1a1a2e',
        background: '#0d0d1a',
      }}>
        <Text style={{ color: '#e6e6e6', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
          {(midpoint * 100).toFixed(1)}¢
        </Text>
        <Text style={{ color: '#555', fontSize: 10, marginLeft: 8 }}>
          Spread: {(spread * 100).toFixed(2)}¢
        </Text>
      </div>

      {/* Bids */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {rawBids.map((bid, i) => {
          const pct = (bid.size / maxSize) * 100;
          return (
            <div key={`bid-${i}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 4px', position: 'relative', cursor: 'pointer' }}>
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${pct}%`, background: 'rgba(0, 212, 170, 0.10)' }} />
              <Text style={{ color: '#00d4aa', fontSize: 11, zIndex: 1, fontFamily: 'monospace' }}>
                {(bid.price * 100).toFixed(1)}¢
              </Text>
              <Text style={{ color: '#999', fontSize: 11, zIndex: 1, fontFamily: 'monospace' }}>
                {fmtSize(bid.size)}
              </Text>
            </div>
          );
        })}
      </div>

      {/* Total depth */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '3px 4px',
        borderTop: '1px solid #1a1a2e',
        background: '#0a0a14',
      }}>
        <Text style={{ color: '#00d4aa', fontSize: 10 }}>
          Bids: {fmtSize(totalBidDepth)}
        </Text>
        <Text style={{ color: '#ff4757', fontSize: 10 }}>
          Asks: {fmtSize(totalAskDepth)}
        </Text>
      </div>
    </div>
  );
}
