import { Typography, Empty } from 'antd';
import { useMarketStore } from '../../stores/marketStore';
import { parseOutcomePrices, formatUsd, getProbabilityColor, formatTimeToResolution } from '../../api/helpers';

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

  const { yes: yesPrice, no: noPrice } = parseOutcomePrices(selectedMarket.outcomePrices);
  const volume = parseFloat(selectedMarket.volume || '0');
  const liquidity = parseFloat(selectedMarket.liquidity || '0');
  const vol24h = selectedMarket.volume24hr || 0;

  // Order book stats
  const bids = orderBook?.bids ?? [];
  const asks = orderBook?.asks ?? [];
  const totalBidDepth = bids.reduce((s, b) => s + parseFloat(b.size), 0);
  const totalAskDepth = asks.reduce((s, a) => s + parseFloat(a.size), 0);
  const bidAskRatio = totalAskDepth > 0 ? totalBidDepth / totalAskDepth : 0;

  const bestBid = bids.length > 0 ? Math.max(...bids.map(b => parseFloat(b.price))) : 0;
  const bestAsk = asks.length > 0 ? Math.min(...asks.map(a => parseFloat(a.price))) : 0;
  const spread = bestAsk > 0 && bestBid > 0 ? (bestAsk - bestBid) * 100 : 0;

  // Trade stats
  const buyTrades = trades.filter(t => t.side === 'BUY');
  const sellTrades = trades.filter(t => t.side === 'SELL');
  const buyVolume = buyTrades.reduce((s, t) => s + parseFloat(t.size), 0);
  const sellVolume = sellTrades.reduce((s, t) => s + parseFloat(t.size), 0);

  // Price range from history
  const sortedHistory = [...priceHistory].sort((a, b) => a.t - b.t);
  const histLen = sortedHistory.length;
  const dayHigh = histLen > 0 ? Math.max(...sortedHistory.slice(-20).map(p => p.c)) * 100 : 0;
  const dayLow = histLen > 0 ? Math.min(...sortedHistory.slice(-20).map(p => p.c)) * 100 : 0;

  // Momentum
  const priceNow = histLen > 0 ? sortedHistory[histLen - 1].c : yesPrice;
  const price10Ago = histLen > 10 ? sortedHistory[Math.max(0, histLen - 10)].c : priceNow;
  const momentum = priceNow - price10Ago;

  // Time to resolution
  const timeInfo = formatTimeToResolution(selectedMarket.endDate || selectedEvent.endDate);

  const stats: { label: string; value: string; color?: string }[] = [
    { label: 'YES Price', value: `${(yesPrice * 100).toFixed(1)}¢`, color: getProbabilityColor(yesPrice) },
    { label: 'NO Price', value: `${(noPrice * 100).toFixed(1)}¢`, color: getProbabilityColor(1 - noPrice) },
    { label: '24h Volume', value: formatUsd(vol24h), color: '#1668dc' },
    { label: 'Total Volume', value: formatUsd(volume) },
    { label: 'Liquidity', value: formatUsd(liquidity) },
    { label: 'Spread', value: `${spread.toFixed(2)}¢`, color: spread < 1 ? '#00d4aa' : spread < 3 ? '#ffd43b' : '#ff4757' },
    { label: 'Bid Depth', value: fmtSize(totalBidDepth), color: '#00d4aa' },
    { label: 'Ask Depth', value: fmtSize(totalAskDepth), color: '#ff4757' },
    { label: 'Bid/Ask Ratio', value: bidAskRatio.toFixed(2), color: bidAskRatio >= 1 ? '#00d4aa' : '#ff4757' },
    { label: 'Buy Volume', value: fmtSize(buyVolume), color: '#00d4aa' },
    { label: 'Sell Volume', value: fmtSize(sellVolume), color: '#ff4757' },
    { label: 'Momentum', value: `${momentum >= 0 ? '+' : ''}${(momentum * 100).toFixed(2)}¢`, color: momentum >= 0 ? '#00d4aa' : '#ff4757' },
    { label: '24h High', value: `${dayHigh.toFixed(1)}¢` },
    { label: '24h Low', value: `${dayLow.toFixed(1)}¢` },
    { label: 'Resolution', value: timeInfo.text, color: timeInfo.color },
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
              padding: '5px 7px',
            }}
          >
            <Text style={{ color: '#555', fontSize: 9, display: 'block', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {stat.label}
            </Text>
            <Text style={{
              color: stat.color || '#ccc',
              fontSize: 12,
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
