import { Typography } from 'antd';
import { useMarketStore } from '../../stores/marketStore';
import { parseOutcomePrices, formatUsd, formatChange, formatTimeToResolution, getProbabilityColor } from '../../api/helpers';

const { Text } = Typography;

export default function MarketHeader() {
  const { selectedEvent, selectedMarket, priceHistory } = useMarketStore();

  if (!selectedEvent || !selectedMarket) {
    return (
      <div style={{ padding: '8px 12px', background: '#0d0d1a' }}>
        <Text style={{ color: '#666', fontSize: 12 }}>Select a market to view details</Text>
      </div>
    );
  }

  const { yes: yesPrice } = parseOutcomePrices(selectedMarket.outcomePrices);
  const volume = parseFloat(selectedMarket.volume || '0');
  const liquidity = parseFloat(selectedMarket.liquidity || '0');
  const vol24h = selectedMarket.volume24hr || 0;
  const spread = selectedMarket.spread ? (selectedMarket.spread * 100).toFixed(2) : '--';

  // Calculate 24h price change
  const dayChange = selectedMarket.oneDayPriceChange ?? 0;
  const changeInfo = formatChange(dayChange * 100);

  // Calculate price change from history as fallback
  const sortedHistory = [...priceHistory].sort((a, b) => a.t - b.t);
  const histLen = sortedHistory.length;
  const firstHistPrice = histLen > 0 ? sortedHistory[0].c : 0;
  const lastHistPrice = histLen > 0 ? sortedHistory[histLen - 1].c : 0;
  const histChange = firstHistPrice > 0 ? ((lastHistPrice - firstHistPrice) / firstHistPrice) * 100 : 0;
  const histAbsChange = (lastHistPrice - firstHistPrice) * 100;

  const displayChange = dayChange !== 0 ? changeInfo : formatChange(histAbsChange);
  const displayPctChange = dayChange !== 0 ? dayChange * 100 : histChange;

  // Time to resolution
  const timeInfo = formatTimeToResolution(selectedMarket.endDate || selectedEvent.endDate);

  // Days remaining
  const endDate = selectedMarket.endDate || selectedEvent.endDate;
  const daysRemaining = endDate
    ? Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div style={{ padding: '6px 10px', background: '#0d0d1a', borderBottom: '1px solid #1a1a2e' }}>
      {/* Title */}
      <Text style={{ color: '#e6e6e6', fontSize: 13, fontWeight: 600, display: 'block', lineHeight: '16px' }} ellipsis>
        {selectedEvent.title}
        {selectedEvent.markets.length > 1 && selectedMarket && (
          <span style={{ color: '#888', fontWeight: 400 }}> — {selectedMarket.question?.slice(0, 50)}</span>
        )}
      </Text>

      {/* Price + Change + Time */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
        <Text style={{
          color: getProbabilityColor(yesPrice),
          fontSize: 24,
          fontWeight: 700,
          fontFamily: 'monospace',
          lineHeight: 1,
        }}>
          {(yesPrice * 100).toFixed(1)}%
        </Text>

        <Text style={{ color: displayChange.color, fontSize: 12, fontWeight: 600 }}>
          {displayChange.arrow} {displayChange.text}
          {displayPctChange !== 0 && (
            <span style={{ color: displayChange.color, opacity: 0.7 }}>
              {' '}({displayPctChange >= 0 ? '+' : ''}{displayPctChange.toFixed(1)}%)
            </span>
          )}
        </Text>

        <Text style={{ color: timeInfo.color, fontSize: 11 }}>
          {timeInfo.urgent ? '⏰ ' : ''}{timeInfo.text}
          {daysRemaining !== null && daysRemaining > 0 && daysRemaining < 365 && (
            <span style={{ color: '#666' }}> ({daysRemaining}d)</span>
          )}
        </Text>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
          {vol24h > 0 && (
            <Text style={{ color: '#666', fontSize: 10 }}>
              24h <span style={{ color: '#999' }}>{formatUsd(vol24h)}</span>
            </Text>
          )}
          <Text style={{ color: '#666', fontSize: 10 }}>
            Vol <span style={{ color: '#999' }}>{formatUsd(volume)}</span>
          </Text>
          <Text style={{ color: '#666', fontSize: 10 }}>
            Liq <span style={{ color: '#999' }}>{formatUsd(liquidity)}</span>
          </Text>
          <Text style={{ color: '#666', fontSize: 10 }}>
            Spread <span style={{ color: '#999' }}>{spread}¢</span>
          </Text>
        </div>
      </div>
    </div>
  );
}
