import { Typography } from 'antd';
import { useMarketStore } from '../../stores/marketStore';
import { parseOutcomePrices, getProbabilityColor, formatChange } from '../../api/helpers';
import type { PolymarketMarket } from '../../types/market';

const { Text } = Typography;

interface OutcomesListProps {
  onOverlayToggle?: () => void;
  overlayAll?: boolean;
}

export default function OutcomesList({ onOverlayToggle, overlayAll }: OutcomesListProps) {
  const { selectedEvent, selectedMarket } = useMarketStore();

  if (!selectedEvent || selectedEvent.markets.length <= 1) return null;

  // Sort markets by YES price descending
  const sortedMarkets = [...selectedEvent.markets]
    .map(m => {
      const { yes } = parseOutcomePrices(m.outcomePrices);
      return { market: m, yesPrice: yes };
    })
    .sort((a, b) => b.yesPrice - a.yesPrice);

  return (
    <div style={{
      width: 240,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      borderRight: '1px solid #1a1a2e',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 8px',
        borderBottom: '1px solid #1a1a2e',
        flexShrink: 0,
      }}>
        <Text style={{ color: '#888', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Outcomes ({sortedMarkets.length})
        </Text>
        {onOverlayToggle && (
          <button
            onClick={onOverlayToggle}
            style={{
              background: overlayAll ? '#1668dc' : '#1a1a2e',
              color: overlayAll ? '#fff' : '#888',
              border: 'none',
              borderRadius: 3,
              padding: '2px 6px',
              fontSize: 9,
              cursor: 'pointer',
            }}
          >
            Overlay All
          </button>
        )}
      </div>

      {/* Outcome rows */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {sortedMarkets.map(({ market, yesPrice }, idx) => (
          <OutcomeRow
            key={market.id}
            market={market}
            rank={idx + 1}
            yesPrice={yesPrice}
            isSelected={market.id === selectedMarket?.id}
          />
        ))}
      </div>
    </div>
  );
}

function OutcomeRow({ market, rank, yesPrice, isSelected }: {
  market: PolymarketMarket;
  rank: number;
  yesPrice: number;
  isSelected: boolean;
}) {
  const selectMarket = useMarketStore(s => s.selectMarket);
  const color = getProbabilityColor(yesPrice);
  const pct = Math.round(yesPrice * 100);
  const dayChange = market.oneDayPriceChange ?? 0;
  const changeInfo = dayChange !== 0 ? formatChange(dayChange * 100) : null;

  const label = market.question
    ?.replace(/^Will\s+/i, '')
    .replace(/\?$/, '')
    .slice(0, 35) || market.outcomes?.[0] || '';

  return (
    <div
      onClick={() => selectMarket(market)}
      style={{
        padding: '5px 8px',
        cursor: 'pointer',
        background: isSelected ? '#1668dc15' : 'transparent',
        borderLeft: isSelected ? '2px solid #1668dc' : '2px solid transparent',
        borderBottom: '1px solid #0d0d1a',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#111128'; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Rank */}
        <span style={{
          width: 18, height: 18, borderRadius: '50%',
          background: rank <= 3 ? color + '22' : '#111128',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, color: rank <= 3 ? color : '#666', fontWeight: 600,
          flexShrink: 0,
        }}>
          {rank}
        </span>

        {/* Name + price */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: isSelected ? '#e6e6e6' : '#bbb', fontSize: 11, display: 'block' }} ellipsis>
            {label}
          </Text>
        </div>

        {/* Price */}
        <Text style={{
          color,
          fontSize: 14,
          fontWeight: 700,
          fontFamily: 'monospace',
          flexShrink: 0,
        }}>
          {pct}%
        </Text>
      </div>

      {/* Probability bar + change */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, marginLeft: 24 }}>
        <div style={{ flex: 1, height: 3, background: '#1a1a2e', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: 2,
            transition: 'width 0.3s',
          }} />
        </div>
        {changeInfo && (
          <Text style={{ color: changeInfo.color, fontSize: 9, fontWeight: 600, flexShrink: 0 }}>
            {changeInfo.arrow}{changeInfo.text}
          </Text>
        )}
      </div>
    </div>
  );
}
