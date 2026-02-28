import { useEffect, useState, useCallback } from 'react';
import { Table, Input, Tag, Space, Typography, Spin } from 'antd';
import { SearchOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useMarketStore } from '../../stores/marketStore';
import { useWatchlistStore } from '../../stores/watchlistStore';
import type { PolymarketEvent } from '../../types/market';

const { Text } = Typography;

const CATEGORY_TAGS = ['All', 'Politics', 'Sports', 'Crypto', 'Science', 'Pop Culture', 'Business'];

export default function MarketBrowser() {
  const {
    events, eventsLoading, loadEvents, searchMarkets, selectEvent,
    activeTag, setActiveTag, selectedEvent,
  } = useMarketStore();
  const { isWatched, toggleWatch } = useWatchlistStore();
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleSearch = useCallback(
    debounce((value: string) => {
      searchMarkets(value);
    }, 400),
    [searchMarkets],
  );

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    handleSearch(val);
  };

  const getPrice = (event: PolymarketEvent): number => {
    const m = event.markets?.[0];
    if (!m) return 0;
    try {
      const prices = JSON.parse(m.outcomePrices as unknown as string || '[]');
      return Math.round((parseFloat(prices[0] || '0')) * 100);
    } catch {
      const prices = m.outcomePrices;
      if (Array.isArray(prices) && prices.length > 0) {
        return Math.round(parseFloat(prices[0]) * 100);
      }
      return 0;
    }
  };

  const getVolume = (event: PolymarketEvent): number => {
    return event.volume || event.markets?.reduce((sum, m) => sum + parseFloat(m.volume || '0'), 0) || 0;
  };

  const getLiquidity = (event: PolymarketEvent): number => {
    return event.liquidity || event.markets?.reduce((sum, m) => sum + parseFloat(m.liquidity || '0'), 0) || 0;
  };

  const columns: ColumnsType<PolymarketEvent> = [
    {
      title: '',
      key: 'watch',
      width: 36,
      render: (_, record) => (
        <span
          onClick={(e) => {
            e.stopPropagation();
            toggleWatch(record.id, record.title, record.slug);
          }}
          style={{ cursor: 'pointer', color: isWatched(record.id) ? '#faad14' : '#555' }}
        >
          {isWatched(record.id) ? <StarFilled /> : <StarOutlined />}
        </span>
      ),
    },
    {
      title: 'Event',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string) => (
        <Text style={{ color: '#e6e6e6', fontSize: 12 }}>{text}</Text>
      ),
    },
    {
      title: 'YES',
      key: 'price',
      width: 65,
      sorter: (a, b) => getPrice(a) - getPrice(b),
      render: (_, record) => {
        const price = getPrice(record);
        return (
          <Text strong style={{ color: price >= 50 ? '#52c41a' : '#ff4d4f', fontSize: 12 }}>
            {price}¢
          </Text>
        );
      },
    },
    {
      title: 'Vol',
      key: 'volume',
      width: 80,
      sorter: (a, b) => getVolume(a) - getVolume(b),
      defaultSortOrder: 'descend',
      render: (_, record) => {
        const vol = getVolume(record);
        return (
          <Text style={{ color: '#999', fontSize: 11 }}>
            ${vol >= 1000000 ? `${(vol / 1000000).toFixed(1)}M` : vol >= 1000 ? `${(vol / 1000).toFixed(0)}K` : vol.toFixed(0)}
          </Text>
        );
      },
    },
    {
      title: 'Liq',
      key: 'liquidity',
      width: 70,
      sorter: (a, b) => getLiquidity(a) - getLiquidity(b),
      render: (_, record) => {
        const liq = getLiquidity(record);
        return (
          <Text style={{ color: '#999', fontSize: 11 }}>
            ${liq >= 1000000 ? `${(liq / 1000000).toFixed(1)}M` : liq >= 1000 ? `${(liq / 1000).toFixed(0)}K` : liq.toFixed(0)}
          </Text>
        );
      },
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Input
        prefix={<SearchOutlined style={{ color: '#666' }} />}
        placeholder="Search markets..."
        value={searchValue}
        onChange={onSearchChange}
        style={{
          marginBottom: 6,
          background: '#1a1a2e',
          borderColor: '#333',
        }}
        allowClear
      />
      <Space wrap size={[4, 4]} style={{ marginBottom: 6 }}>
        {CATEGORY_TAGS.map(tag => (
          <Tag
            key={tag}
            color={activeTag === (tag === 'All' ? '' : tag) ? '#1668dc' : undefined}
            onClick={() => setActiveTag(tag === 'All' ? '' : tag)}
            style={{
              cursor: 'pointer',
              fontSize: 11,
              margin: 0,
              background: activeTag === (tag === 'All' ? '' : tag) ? '#1668dc' : '#1a1a2e',
              borderColor: '#333',
              color: '#ccc',
            }}
          >
            {tag}
          </Tag>
        ))}
      </Space>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Spin spinning={eventsLoading} size="small">
          <Table
            dataSource={events}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={false}
            showSorterTooltip={false}
            onRow={(record) => ({
              onClick: () => selectEvent(record),
              style: {
                cursor: 'pointer',
                background: selectedEvent?.id === record.id ? '#1a1a3e' : undefined,
              },
            })}
            scroll={{ y: 'calc(100% - 10px)' }}
            style={{ fontSize: 11 }}
          />
        </Spin>
      </div>
    </div>
  );
}

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}
