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

  const bids = (orderBook?.bids ?? []).slice(0, MAX_LEVELS);
  const asks = (orderBook?.asks ?? []).slice(0, MAX_LEVELS);

  const maxBidSize = Math.max(...bids.map(b => parseFloat(b.size)), 1);
  const maxAskSize = Math.max(...asks.map(a => parseFloat(a.size)), 1);

  const bestBid = bids.length > 0 ? parseFloat(bids[0].price) : 0;
  const bestAsk = asks.length > 0 ? parseFloat(asks[0].price) : 0;
  const spread = bestAsk - bestBid;
  const midpoint = (bestBid + bestAsk) / 2;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontSize: 11 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, padding: '0 4px' }}>
        <Text style={{ color: '#888', fontSize: 10 }}>PRICE</Text>
        <Text style={{ color: '#888', fontSize: 10 }}>SIZE</Text>
      </div>

      {/* Asks (reversed, cheapest at bottom) */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {[...asks].reverse().map((ask, i) => {
          const size = parseFloat(ask.size);
          const pct = (size / maxAskSize) * 100;
          return (
            <div
              key={`ask-${i}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '1px 4px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: `${pct}%`,
                  background: 'rgba(239, 83, 80, 0.12)',
                }}
              />
              <Text style={{ color: '#ef5350', fontSize: 11, zIndex: 1 }}>
                {(parseFloat(ask.price) * 100).toFixed(1)}¢
              </Text>
              <Text style={{ color: '#999', fontSize: 11, zIndex: 1 }}>
                {size >= 1000 ? `${(size / 1000).toFixed(1)}K` : size.toFixed(0)}
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
        <Text style={{ color: '#e6e6e6', fontSize: 13, fontWeight: 700 }}>
          {(midpoint * 100).toFixed(1)}¢
        </Text>
        <Text style={{ color: '#666', fontSize: 10, marginLeft: 8 }}>
          Spread: {(spread * 100).toFixed(2)}¢
        </Text>
      </div>

      {/* Bids */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {bids.map((bid, i) => {
          const size = parseFloat(bid.size);
          const pct = (size / maxBidSize) * 100;
          return (
            <div
              key={`bid-${i}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '1px 4px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: `${pct}%`,
                  background: 'rgba(38, 166, 154, 0.12)',
                }}
              />
              <Text style={{ color: '#26a69a', fontSize: 11, zIndex: 1 }}>
                {(parseFloat(bid.price) * 100).toFixed(1)}¢
              </Text>
              <Text style={{ color: '#999', fontSize: 11, zIndex: 1 }}>
                {size >= 1000 ? `${(size / 1000).toFixed(1)}K` : size.toFixed(0)}
              </Text>
            </div>
          );
        })}
      </div>
    </div>
  );
}
