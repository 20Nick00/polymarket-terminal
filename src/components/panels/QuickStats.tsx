import { Typography, Empty } from 'antd';
import { useMarketStore } from '../../stores/marketStore';
import { parseOutcomePrices, formatUsd } from '../../api/helpers';

const { Text } = Typography;

export default function QuickStats() {
  const { selectedMarket, selectedEvent, orderBook, trades, priceHistory } = useMarketStore();

  if (!selectedMarket || !selectedEvent) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description={<Text style={{ color: '#666' }}>Select a market</Text>} />
      </div>
    );
  }

  const { yes: yesPrice } = parseOutcomePrices(selectedMarket.outcomePrices);
  const volume = parseFloat(selectedMarket.volume || '0');
  const liquidity = parseFloat(selectedMarket.liquidity || '0');
  const vol24h = selectedMarket.volume24hr || 0;

  // Order book stats
  const bids = orderBook?.bids ?? [];
  const asks = orderBook?.asks ?? [];
  const totalBidDepth = bids.reduce((s, b) => s + parseFloat(b.size), 0);
  const totalAskDepth = asks.reduce((s, a) => s + parseFloat(a.size), 0);
  const bidAskRatio = totalAskDepth > 0 ? totalBidDepth / totalAskDepth : 0;

  const bestBid = bids.length > 0 ? parseFloat(bids.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))[0].price) : 0;
  const bestAsk = asks.length > 0 ? parseFloat(asks.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))[0].price) : 0;
  const spread = bestAsk > 0 && bestBid > 0 ? (bestAsk - bestBid) * 100 : 0;

  // Trade stats
  const buyTrades = trades.filter(t => t.side === 'BUY');
  const sellTrades = trades.filter(t => t.side === 'SELL');
  const buyVolume = buyTrades.reduce((s, t) => s + parseFloat(t.size), 0);
  const sellVolume = sellTrades.reduce((s, t) => s + parseFloat(t.size), 0);

  // Price momentum from history
  const sortedHistory = [...priceHistory].sort((a, b) => a.t - b.t);
  const histLen = sortedHistory.length;
  const priceNow = histLen > 0 ? sortedHistory[histLen - 1].c : yesPrice;
  const price1hAgo = histLen > 10 ? sortedHistory[Math.max(0, histLen - 10)].c : priceNow;
  const momentum1h = priceNow - price1hAgo;

  const stats: { label: string; value: string; color?: string }[] = [
    { label: 'Current Price', value: `${(yesPrice * 100).toFixed(1)}¢`, color: '#fff' },
    { label: '24h Volume', value: formatUsd(vol24h), color: '#1668dc' },
    { label: 'Total Volume', value: formatUsd(volume) },
    { label: 'Liquidity', value: formatUsd(liquidity) },
    { label: 'Spread', value: `${spread.toFixed(2)}¢`, color: spread < 1 ? '#00d4aa' : spread < 3 ? '#faad14' : '#ff4757' },
    { label: 'Bid Depth', value: fmtSize(totalBidDepth), color: '#00d4aa' },
    { label: 'Ask Depth', value: fmtSize(totalAskDepth), color: '#ff4757' },
    { label: 'Bid/Ask Ratio', value: bidAskRatio.toFixed(2), color: bidAskRatio >= 1 ? '#00d4aa' : '#ff4757' },
    { label: 'Buy Volume', value: fmtSize(buyVolume), color: '#00d4aa' },
    { label: 'Sell Volume', value: fmtSize(sellVolume), color: '#ff4757' },
    { label: 'Momentum', value: `${momentum1h >= 0 ? '+' : ''}${(momentum1h * 100).toFixed(2)}¢`, color: momentum1h >= 0 ? '#00d4aa' : '#ff4757' },
    { label: 'Recent Trades', value: `${trades.length}` },
  ];

  return (
    <div style={{ height: '100%', overflow: 'auto', fontSize: 11 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, padding: 2 }}>
        {stats.map(stat => (
          <div
            key={stat.label}
            style={{
              background: '#111128',
              borderRadius: 3,
              padding: '6px 8px',
            }}
          >
            <Text style={{ color: '#666', fontSize: 9, display: 'block', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {stat.label}
            </Text>
            <Text style={{
              color: stat.color || '#ccc',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'monospace',
              display: 'block',
              marginTop: 1,
            }}>
              {stat.value}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}

function fmtSize(size: number): string {
  if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(1)}M`;
  if (size >= 1_000) return `${(size / 1_000).toFixed(1)}K`;
  return size.toFixed(0);
}
