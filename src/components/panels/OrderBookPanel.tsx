import { Typography, Spin, Empty } from 'antd';
import { useMarketStore } from '../../stores/marketStore';

const { Text } = Typography;

const MAX_LEVELS = 12;

export default function OrderBookPanel() {
  const { orderBook, orderBookLoading, selectedMarket } = useMarketStore();

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

  // Cumulative depth
  const bidsCumulative = rawBids.map((bid, i) => ({
    ...bid,
    cumSize: rawBids.slice(0, i + 1).reduce((s, b) => s + b.size, 0),
  }));

  const asksCumulative = rawAsks.map((ask, i) => ({
    ...ask,
    cumSize: rawAsks.slice(0, i + 1).reduce((s, a) => s + a.size, 0),
  }));

  const totalBidDepth = bidsCumulative.length > 0 ? bidsCumulative[bidsCumulative.length - 1].cumSize : 0;
  const totalAskDepth = asksCumulative.length > 0 ? asksCumulative[asksCumulative.length - 1].cumSize : 0;
  const maxCumSize = Math.max(totalBidDepth, totalAskDepth, 1);

  const bestBid = rawBids.length > 0 ? rawBids[0].price : 0;
  const bestAsk = rawAsks.length > 0 ? rawAsks[0].price : 0;
  const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0;
  const midpoint = bestBid > 0 && bestAsk > 0 ? (bestBid + bestAsk) / 2 : bestBid || bestAsk;

  const fmtSize = (s: number) =>
    s >= 1_000_000 ? `${(s / 1_000_000).toFixed(1)}M`
      : s >= 1_000 ? `${(s / 1_000).toFixed(1)}K`
        : s.toFixed(0);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontSize: 11 }}>
      {/* Mini depth visualization */}
      <div style={{ height: 24, display: 'flex', padding: '0 4px', flexShrink: 0, gap: 1 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 1 }}>
          {[...bidsCumulative].reverse().map((bid, i) => (
            <div
              key={`bd-${i}`}
              style={{
                width: `${100 / MAX_LEVELS}%`,
                height: `${(bid.cumSize / maxCumSize) * 100}%`,
                background: '#00d4aa33',
                borderRadius: '1px 1px 0 0',
                minHeight: 1,
              }}
            />
          ))}
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          {asksCumulative.map((ask, i) => (
            <div
              key={`ad-${i}`}
              style={{
                width: `${100 / MAX_LEVELS}%`,
                height: `${(ask.cumSize / maxCumSize) * 100}%`,
                background: '#ff475733',
                borderRadius: '1px 1px 0 0',
                minHeight: 1,
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', borderBottom: '1px solid #1a1a2e', borderTop: '1px solid #1a1a2e' }}>
        <Text style={{ color: '#666', fontSize: 9, textTransform: 'uppercase' }}>Price</Text>
        <Text style={{ color: '#666', fontSize: 9, textTransform: 'uppercase' }}>Size</Text>
        <Text style={{ color: '#666', fontSize: 9, textTransform: 'uppercase' }}>Total</Text>
      </div>

      {/* Asks (reversed so cheapest at bottom, near spread) */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {[...asksCumulative].reverse().map((ask, i) => {
          const cumPct = (ask.cumSize / maxCumSize) * 100;
          return (
            <div key={`ask-${i}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 4px', position: 'relative' }}>
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${cumPct}%`, background: 'rgba(255, 71, 87, 0.08)' }} />
              <Text style={{ color: '#ff4757', fontSize: 11, zIndex: 1, fontFamily: 'monospace', flex: 1 }}>
                {(ask.price * 100).toFixed(1)}¢
              </Text>
              <Text style={{ color: '#999', fontSize: 11, zIndex: 1, fontFamily: 'monospace', width: 50, textAlign: 'right' }}>
                {fmtSize(ask.size)}
              </Text>
              <Text style={{ color: '#666', fontSize: 10, zIndex: 1, fontFamily: 'monospace', width: 50, textAlign: 'right' }}>
                {fmtSize(ask.cumSize)}
              </Text>
            </div>
          );
        })}
      </div>

      {/* Spread / Midpoint */}
      <div style={{
        textAlign: 'center',
        padding: '3px 0',
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
        {bidsCumulative.map((bid, i) => {
          const cumPct = (bid.cumSize / maxCumSize) * 100;
          return (
            <div key={`bid-${i}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 4px', position: 'relative' }}>
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${cumPct}%`, background: 'rgba(0, 212, 170, 0.08)' }} />
              <Text style={{ color: '#00d4aa', fontSize: 11, zIndex: 1, fontFamily: 'monospace', flex: 1 }}>
                {(bid.price * 100).toFixed(1)}¢
              </Text>
              <Text style={{ color: '#999', fontSize: 11, zIndex: 1, fontFamily: 'monospace', width: 50, textAlign: 'right' }}>
                {fmtSize(bid.size)}
              </Text>
              <Text style={{ color: '#666', fontSize: 10, zIndex: 1, fontFamily: 'monospace', width: 50, textAlign: 'right' }}>
                {fmtSize(bid.cumSize)}
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
        flexShrink: 0,
      }}>
        <Text style={{ color: '#00d4aa', fontSize: 10, fontWeight: 600 }}>
          Bids: {fmtSize(totalBidDepth)}
        </Text>
        <Text style={{ color: '#ff4757', fontSize: 10, fontWeight: 600 }}>
          Asks: {fmtSize(totalAskDepth)}
        </Text>
      </div>
    </div>
  );
}
