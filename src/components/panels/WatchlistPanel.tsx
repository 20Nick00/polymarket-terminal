import { useEffect, useState, useCallback } from 'react';
import { Typography, List, Button } from 'antd';
import { StarFilled, DeleteOutlined } from '@ant-design/icons';
import { useWatchlistStore } from '../../stores/watchlistStore';
import { useMarketStore } from '../../stores/marketStore';
import { fetchEvent } from '../../api/gamma';
import type { PolymarketEvent } from '../../types/market';

const { Text } = Typography;

export default function WatchlistPanel() {
  const { items, removeItem } = useWatchlistStore();
  const { selectEvent } = useMarketStore();
  const [eventCache, setEventCache] = useState<Record<string, PolymarketEvent>>({});

  const loadWatchlistPrices = useCallback(async () => {
    const toLoad = items.filter(i => !eventCache[i.eventId]);
    if (toLoad.length === 0) return;

    const results = await Promise.allSettled(
      toLoad.map(item => fetchEvent(item.eventId))
    );

    const newCache: Record<string, PolymarketEvent> = {};
    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        newCache[toLoad[idx].eventId] = result.value;
      }
    });

    if (Object.keys(newCache).length > 0) {
      setEventCache(prev => ({ ...prev, ...newCache }));
    }
  }, [items, eventCache]);

  useEffect(() => {
    loadWatchlistPrices();
  }, [items.length]); // only reload when items change

  // Refresh prices periodically
  useEffect(() => {
    if (items.length === 0) return;
    const timer = window.setInterval(async () => {
      const results = await Promise.allSettled(
        items.map(item => fetchEvent(item.eventId))
      );
      const updated: Record<string, PolymarketEvent> = {};
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          updated[items[idx].eventId] = result.value;
        }
      });
      setEventCache(prev => ({ ...prev, ...updated }));
    }, 30000);
    return () => clearInterval(timer);
  }, [items]);

  if (items.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <StarFilled style={{ fontSize: 24, color: '#333', marginBottom: 8 }} />
        <Text style={{ color: '#666', fontSize: 12 }}>Star events to add to watchlist</Text>
      </div>
    );
  }

  const getPrice = (eventId: string): string => {
    const event = eventCache[eventId];
    if (!event?.markets?.[0]) return '--';
    const m = event.markets[0];
    try {
      const prices = JSON.parse(m.outcomePrices as unknown as string || '[]');
      return `${(parseFloat(prices[0] || '0') * 100).toFixed(0)}¢`;
    } catch {
      if (Array.isArray(m.outcomePrices) && m.outcomePrices.length > 0) {
        return `${(parseFloat(m.outcomePrices[0]) * 100).toFixed(0)}¢`;
      }
      return '--';
    }
  };

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <List
        dataSource={items}
        size="small"
        renderItem={(item) => {
          const event = eventCache[item.eventId];
          return (
            <List.Item
              style={{
                padding: '4px 4px',
                borderBottom: '1px solid #1a1a2e',
                cursor: 'pointer',
              }}
              onClick={() => {
                if (event) selectEvent(event);
              }}
              actions={[
                <Button
                  key="delete"
                  type="text"
                  size="small"
                  icon={<DeleteOutlined style={{ color: '#555', fontSize: 11 }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(item.eventId);
                  }}
                />,
              ]}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{ color: '#d4d4d4', fontSize: 11, display: 'block' }}
                  ellipsis
                >
                  {item.title}
                </Text>
                <Text style={{ color: '#52c41a', fontSize: 12, fontWeight: 600 }}>
                  {getPrice(item.eventId)}
                </Text>
              </div>
            </List.Item>
          );
        }}
      />
    </div>
  );
}
