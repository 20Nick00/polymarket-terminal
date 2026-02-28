import { useEffect, useState, useCallback, useMemo } from 'react';
import { Input, Typography, Spin, Space, Tag } from 'antd';
import { SearchOutlined, StarOutlined, StarFilled, ClockCircleOutlined } from '@ant-design/icons';
import { useMarketStore } from '../../stores/marketStore';
import { useWatchlistStore } from '../../stores/watchlistStore';
import { parseOutcomePrices, formatUsd, getProbabilityColor, formatChange, formatTimeToResolution } from '../../api/helpers';
import type { PolymarketEvent, PolymarketMarket } from '../../types/market';

const { Text } = Typography;

const CATEGORY_TAGS = ['All', 'Politics', 'Sports', 'Crypto', 'Science', 'Pop Culture', 'Business'];

export default function MarketBrowser() {
  const {
    events, eventsLoading, loadEvents, searchMarkets, selectEvent,
    activeTag, setActiveTag, selectedEvent, compareEvent, setCompareEvent,
  } = useMarketStore();
  const { isWatched, toggleWatch } = useWatchlistStore();
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleSearch = useCallback(
    debounce((value: string) => {
      searchMarkets(value);
    }, 300),
    [searchMarkets],
  );

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    handleSearch(val);
  };

  // Client-side filter for instant feel
  const filteredEvents = useMemo(() => {
    if (!searchValue.trim()) return events;
    const q = searchValue.toLowerCase();
    return events.filter(ev =>
      ev.title.toLowerCase().includes(q) ||
      ev.description?.toLowerCase().includes(q) ||
      ev.markets?.some(m =>
        m.question?.toLowerCase().includes(q) ||
        m.outcomes?.some(o => o.toLowerCase().includes(q))
      )
    );
  }, [events, searchValue]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Input
        className="market-search-input"
        prefix={<SearchOutlined style={{ color: '#666' }} />}
        placeholder="Search markets... (Ctrl+K)"
        value={searchValue}
        onChange={onSearchChange}
        style={{
          marginBottom: 4,
          background: '#1a1a2e',
          borderColor: '#333',
        }}
        allowClear
        size="small"
      />
      <Space wrap size={[3, 3]} style={{ marginBottom: 4, flexShrink: 0 }}>
        {CATEGORY_TAGS.map(tag => (
          <Tag
            key={tag}
            onClick={() => setActiveTag(tag === 'All' ? '' : tag)}
            style={{
              cursor: 'pointer',
              fontSize: 10,
              margin: 0,
              padding: '0 6px',
              lineHeight: '18px',
              background: activeTag === (tag === 'All' ? '' : tag) ? '#1668dc' : '#111128',
              borderColor: 'transparent',
              color: activeTag === (tag === 'All' ? '' : tag) ? '#fff' : '#888',
              borderRadius: 3,
            }}
          >
            {tag}
          </Tag>
        ))}
      </Space>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {eventsLoading && filteredEvents.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
            <Spin size="small" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Text style={{ color: '#666', fontSize: 11 }}>
              {searchValue ? 'No results — try broadening your search' : 'No markets found'}
            </Text>
          </div>
        ) : (
          filteredEvents.map((event, idx) => (
            <MarketRow
              key={event.id}
              event={event}
              index={idx + 1}
              isSelected={selectedEvent?.id === event.id}
              isComparing={compareEvent?.id === event.id}
              isWatched={isWatched(event.id)}
              onSelect={(ctrlKey) => {
                if (ctrlKey && selectedEvent && selectedEvent.id !== event.id) {
                  setCompareEvent(event);
                } else {
                  setCompareEvent(null);
                  selectEvent(event);
                }
              }}
              onToggleWatch={() => toggleWatch(event.id, event.title, event.slug)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface MarketRowProps {
  event: PolymarketEvent;
  index: number;
  isSelected: boolean;
  isComparing: boolean;
  isWatched: boolean;
  onSelect: (ctrlKey: boolean) => void;
  onToggleWatch: () => void;
}

function MarketRow({ event, index, isSelected, isComparing, isWatched, onSelect, onToggleWatch }: MarketRowProps) {
  const isMultiOutcome = event.markets && event.markets.length > 1;
  const primaryMarket = event.markets?.[0];

  // Get price from first market
  const yesPrice = primaryMarket ? parseOutcomePrices(primaryMarket.outcomePrices).yes : 0;

  // Get 24h change
  const dayChange = primaryMarket?.oneDayPriceChange ?? 0;
  const changeInfo = formatChange(dayChange * 100);

  // Volume & Liquidity
  const vol = event.volume || event.markets?.reduce((s, m) => s + parseFloat(m.volume || '0'), 0) || 0;
  const liq = event.liquidity || event.markets?.reduce((s, m) => s + parseFloat(m.liquidity || '0'), 0) || 0;

  // Time to resolution
  const endDate = primaryMarket?.endDate || event.endDate;
  const timeInfo = formatTimeToResolution(endDate);

  // Image
  const imageUrl = event.image || primaryMarket?.image;

  // Top outcomes for multi-outcome
  const topOutcomes = isMultiOutcome
    ? getTopOutcomes(event.markets, 3)
    : [];

  return (
    <div
      onClick={(e) => onSelect(e.ctrlKey || e.metaKey)}
      style={{
        padding: '6px 6px',
        borderBottom: '1px solid #111128',
        cursor: 'pointer',
        background: isSelected ? '#1a1a3e' : isComparing ? '#1a2a1a' : 'transparent',
        borderLeft: isSelected ? '2px solid #1668dc' : isComparing ? '2px solid #a855f7' : '2px solid transparent',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { if (!isSelected && !isComparing) e.currentTarget.style.background = '#111128'; }}
      onMouseLeave={(e) => { if (!isSelected && !isComparing) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        {/* Row number */}
        <Text style={{ color: '#444', fontSize: 9, width: 16, textAlign: 'right', flexShrink: 0, marginTop: 2 }}>
          #{index}
        </Text>

        {/* Thumbnail */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            style={{
              width: 32, height: 32, borderRadius: 4, objectFit: 'cover',
              flexShrink: 0, background: '#1a1a2e',
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div style={{
            width: 32, height: 32, borderRadius: 4, flexShrink: 0,
            background: getProbabilityColor(yesPrice) + '22',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: getProbabilityColor(yesPrice),
            fontSize: 14, fontWeight: 700,
          }}>
            {event.title.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
            <Text
              style={{ color: '#e6e6e6', fontSize: 11, lineHeight: '14px', flex: 1 }}
              ellipsis
            >
              {event.title}
            </Text>

            {/* Star */}
            <span
              onClick={(e) => { e.stopPropagation(); onToggleWatch(); }}
              style={{ color: isWatched ? '#faad14' : '#333', fontSize: 11, flexShrink: 0, cursor: 'pointer' }}
            >
              {isWatched ? <StarFilled /> : <StarOutlined />}
            </span>
          </div>

          {/* Price + Change row */}
          {!isMultiOutcome && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
              <Text style={{
                color: getProbabilityColor(yesPrice),
                fontSize: 18,
                fontWeight: 700,
                fontFamily: 'monospace',
                lineHeight: 1,
              }}>
                {Math.round(yesPrice * 100)}%
              </Text>
              {dayChange !== 0 && (
                <Text style={{ color: changeInfo.color, fontSize: 10, fontWeight: 600 }}>
                  {changeInfo.arrow} {changeInfo.text}
                </Text>
              )}
              {timeInfo.urgent && (
                <ClockCircleOutlined style={{ color: '#ff6b6b', fontSize: 10 }} />
              )}
            </div>
          )}

          {/* Multi-outcome preview */}
          {isMultiOutcome && topOutcomes.length > 0 && (
            <div style={{ marginTop: 2 }}>
              <Text style={{ color: '#999', fontSize: 10, lineHeight: '14px' }}>
                {topOutcomes.map((o, i) => (
                  <span key={o.question}>
                    {i > 0 && <span style={{ color: '#444' }}> · </span>}
                    <span style={{ color: '#ccc' }}>{o.label}</span>
                    {' '}
                    <span style={{ color: getProbabilityColor(o.price), fontWeight: 600 }}>
                      {Math.round(o.price * 100)}%
                    </span>
                  </span>
                ))}
              </Text>
            </div>
          )}

          {/* Volume + Liquidity row */}
          <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
            <Text style={{ color: '#555', fontSize: 9 }}>
              Vol {formatUsd(vol)}
            </Text>
            <Text style={{ color: '#555', fontSize: 9 }}>
              Liq {formatUsd(liq)}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTopOutcomes(markets: PolymarketMarket[], count: number): { question: string; label: string; price: number }[] {
  return markets
    .map(m => {
      const { yes } = parseOutcomePrices(m.outcomePrices);
      // For multi-outcome, the question IS the outcome label
      const label = m.question?.replace(/^Will /, '').replace(/\?$/, '').slice(0, 25) || m.outcomes?.[0] || '';
      return { question: m.question || '', label, price: yes };
    })
    .sort((a, b) => b.price - a.price)
    .slice(0, count);
}

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}
