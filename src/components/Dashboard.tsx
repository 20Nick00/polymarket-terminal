import { useCallback } from 'react';
import { ResponsiveGridLayout, useContainerWidth, verticalCompactor } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import { Typography, Button, Tooltip } from 'antd';
import {
  ReloadOutlined,
  LayoutOutlined,
  BarChartOutlined,
  ReadOutlined,
  TeamOutlined,
  LineChartOutlined,
  ThunderboltOutlined,
  DashboardOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useLayoutStore } from '../stores/layoutStore';
import { useMarketStore } from '../stores/marketStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import LeftPanel from './panels/LeftPanel';
import PriceChart from './panels/PriceChart';
import OrderBookNewsPanel from './panels/OrderBookNewsPanel';
import MarketInfo from './panels/MarketInfo';
import TopHolders from './panels/TopHolders';
import TradeTicker from './panels/TradeTicker';
import QuickStats from './panels/QuickStats';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const { Text } = Typography;

const PANEL_CONFIG: Record<string, { title: string; icon: React.ReactNode }> = {
  'left-panel': { title: 'Markets', icon: <AppstoreOutlined /> },
  'chart': { title: 'Chart', icon: <LineChartOutlined /> },
  'order-book-news': { title: 'Book / News', icon: <BarChartOutlined /> },
  'market-info': { title: 'Market Info', icon: <ReadOutlined /> },
  'top-holders': { title: 'Top Holders', icon: <TeamOutlined /> },
  'trade-ticker': { title: 'Trades', icon: <ThunderboltOutlined /> },
  'quick-stats': { title: 'Analytics', icon: <DashboardOutlined /> },
};

const PANEL_COMPONENTS: Record<string, React.FC> = {
  'left-panel': LeftPanel,
  'chart': PriceChart,
  'order-book-news': OrderBookNewsPanel,
  'market-info': MarketInfo,
  'top-holders': TopHolders,
  'trade-ticker': TradeTicker,
  'quick-stats': QuickStats,
};

export default function Dashboard() {
  const { layout, setLayout, resetLayout } = useLayoutStore();
  const { refreshSelectedMarketData } = useMarketStore();
  const { width, containerRef, mounted } = useContainerWidth({ initialWidth: 1280 });

  useKeyboardShortcuts();

  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      setLayout(newLayout as unknown as { i: string; x: number; y: number; w: number; h: number; minW?: number; minH?: number }[]);
    },
    [setLayout],
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a14' }}>
      {/* Top bar */}
      <div
        style={{
          height: 36,
          background: '#0d0d1a',
          borderBottom: '1px solid #1a1a2e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: '#1668dc', fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>
            POLYTERM
          </Text>
          <Text style={{ color: '#444', fontSize: 11 }}>
            Polymarket Trading Terminal
          </Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Shortcut hints */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { keys: 'Ctrl+K', desc: 'Search' },
              { keys: 'R', desc: 'Refresh' },
              { keys: 'W', desc: 'Watch' },
              { keys: 'Esc', desc: 'Deselect' },
            ].map(s => (
              <Text key={s.keys} style={{ color: '#444', fontSize: 9 }}>
                <kbd style={{
                  background: '#1a1a2e',
                  border: '1px solid #2a2a3e',
                  borderRadius: 2,
                  padding: '0 3px',
                  fontSize: 9,
                  color: '#666',
                  marginRight: 2,
                }}>
                  {s.keys}
                </kbd>
                {s.desc}
              </Text>
            ))}
          </div>
          <div style={{ width: 1, height: 16, background: '#1a1a2e' }} />
          <Tooltip title="Refresh data (R)">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined style={{ color: '#888' }} />}
              onClick={() => refreshSelectedMarketData()}
            />
          </Tooltip>
          <Tooltip title="Reset layout">
            <Button
              type="text"
              size="small"
              icon={<LayoutOutlined style={{ color: '#888' }} />}
              onClick={resetLayout}
            />
          </Tooltip>
        </div>
      </div>

      {/* Grid */}
      <div ref={containerRef} style={{ flex: 1, overflow: 'auto' }}>
        {mounted && (
          <ResponsiveGridLayout
            className="layout"
            width={width}
            layouts={{ lg: layout as unknown as Layout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768 }}
            cols={{ lg: 12, md: 10, sm: 6 }}
            rowHeight={30}
            onLayoutChange={handleLayoutChange}
            compactor={verticalCompactor}
            margin={[4, 4] as readonly [number, number]}
            containerPadding={[4, 4] as readonly [number, number]}
            dragConfig={{ handle: '.panel-header' }}
          >
            {layout.map((item) => {
              const config = PANEL_CONFIG[item.i];
              const Component = PANEL_COMPONENTS[item.i];
              if (!config || !Component) return null;

              return (
                <div key={item.i} style={{ background: '#0d0d1a', borderRadius: 4, border: '1px solid #1a1a2e', overflow: 'hidden' }}>
                  <div
                    className="panel-header"
                    style={{
                      height: 24,
                      background: '#111128',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 8px',
                      cursor: 'grab',
                      borderBottom: '1px solid #1a1a2e',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ color: '#555', fontSize: 11, marginRight: 6 }}>
                      {config.icon}
                    </span>
                    <Text style={{ color: '#888', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {config.title}
                    </Text>
                  </div>
                  <div style={{ height: 'calc(100% - 24px)', padding: 6, overflow: 'hidden' }}>
                    <Component />
                  </div>
                </div>
              );
            })}
          </ResponsiveGridLayout>
        )}
      </div>
    </div>
  );
}
