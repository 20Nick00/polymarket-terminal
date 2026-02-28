import { useState } from 'react';
import { Typography } from 'antd';
import { BarChartOutlined, ReadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useMarketStore } from '../../stores/marketStore';
import OrderBookPanel from './OrderBookPanel';
import TradeTicker from './TradeTicker';
import NewsPanel from './NewsPanel';

const { Text } = Typography;

const TABS = [
  { key: 'orderbook', label: 'Book', icon: <BarChartOutlined /> },
  { key: 'trades', label: 'Trades', icon: <ThunderboltOutlined /> },
  { key: 'news', label: 'News', icon: <ReadOutlined /> },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function OrderBookNewsPanel() {
  const [activeTab, setActiveTab] = useState<TabKey>('orderbook');
  const { news, trades } = useMarketStore();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              padding: '4px 0',
              background: activeTab === tab.key ? '#1a1a2e' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #1668dc' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ color: activeTab === tab.key ? '#1668dc' : '#555', fontSize: 10 }}>
              {tab.icon}
            </span>
            <Text style={{ color: activeTab === tab.key ? '#ccc' : '#666', fontSize: 10, fontWeight: 500 }}>
              {tab.label}
            </Text>
            {tab.key === 'trades' && trades.length > 0 && (
              <span style={{ background: '#333', color: '#aaa', fontSize: 8, borderRadius: 6, padding: '0 4px', lineHeight: '12px' }}>
                {trades.length}
              </span>
            )}
            {tab.key === 'news' && news.length > 0 && (
              <span style={{ background: '#333', color: '#aaa', fontSize: 8, borderRadius: 6, padding: '0 4px', lineHeight: '12px' }}>
                {news.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'orderbook' && <OrderBookPanel />}
        {activeTab === 'trades' && <TradeTicker />}
        {activeTab === 'news' && <NewsPanel />}
      </div>
    </div>
  );
}
