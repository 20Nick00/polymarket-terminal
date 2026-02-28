import { useEffect, useState } from 'react';
import { Typography, Input, Spin, Empty, Table } from 'antd';
import { WalletOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import { usePortfolioStore } from '../../stores/portfolioStore';
import { formatUsd, getProbabilityColor } from '../../api/helpers';
import type { Position } from '../../types/market';

const { Text, Paragraph } = Typography;

const PIE_COLORS = ['#1668dc', '#00d4aa', '#ff4757', '#ffd43b', '#a855f7', '#ff6b6b', '#51cf66', '#f97316', '#06b6d4', '#ec4899'];

export default function PortfolioDashboard() {
  const {
    walletAddress, positions, positionsLoading, tradeHistory, historyLoading,
    totalValue, totalPnl, totalPnlPct, unrealizedPnl, realizedPnl,
    setWallet, loadPositions, loadTradeHistory,
  } = usePortfolioStore();
  const [inputAddress, setInputAddress] = useState(walletAddress);
  const [activeTab, setActiveTab] = useState<'positions' | 'history'>('positions');

  useEffect(() => {
    if (walletAddress) {
      loadPositions();
      loadTradeHistory();
    }
  }, [walletAddress, loadPositions, loadTradeHistory]);

  const handleSubmit = () => {
    const addr = inputAddress.trim();
    if (addr) setWallet(addr);
  };

  // Not connected
  if (!walletAddress) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 }}>
        <WalletOutlined style={{ fontSize: 32, color: '#1668dc' }} />
        <Text style={{ color: '#ccc', fontSize: 14, fontWeight: 600 }}>Portfolio Tracker</Text>
        <Text style={{ color: '#888', fontSize: 11, textAlign: 'center' }}>
          Enter a Polymarket wallet address to track positions and P&L
        </Text>
        <Input
          placeholder="0x... wallet address"
          value={inputAddress}
          onChange={e => setInputAddress(e.target.value)}
          onPressEnter={handleSubmit}
          style={{ maxWidth: 400, background: '#1a1a2e', borderColor: '#333' }}
          suffix={<SearchOutlined onClick={handleSubmit} style={{ cursor: 'pointer', color: '#1668dc' }} />}
        />
      </div>
    );
  }

  if (positionsLoading && positions.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin tip="Loading positions..." />
      </div>
    );
  }

  // Summary cards
  const summaryCards = [
    { label: 'Total Value', value: formatUsd(totalValue), color: '#1668dc' },
    { label: 'Total P&L', value: `${totalPnl >= 0 ? '+' : ''}${formatUsd(totalPnl)}`, color: totalPnl >= 0 ? '#00d4aa' : '#ff4757', sub: `${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(1)}%` },
    { label: 'Unrealized P&L', value: `${unrealizedPnl >= 0 ? '+' : ''}${formatUsd(unrealizedPnl)}`, color: unrealizedPnl >= 0 ? '#00d4aa' : '#ff4757' },
    { label: 'Realized P&L', value: `${realizedPnl >= 0 ? '+' : ''}${formatUsd(realizedPnl)}`, color: realizedPnl >= 0 ? '#00d4aa' : '#ff4757' },
    { label: 'Positions', value: `${positions.length}`, color: '#ccc' },
  ];

  // Pie chart data
  const pieData = positions
    .filter(p => p.currentValue > 0)
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 10)
    .map(p => ({
      name: p.title.slice(0, 30),
      value: p.currentValue,
      pnl: p.cashPnl,
    }));

  // Risk metrics
  const maxLoss = positions.reduce((s, p) => s + (p.initialValue || 0), 0);
  const maxGain = positions.reduce((s, p) => s + (p.size * 1 - (p.initialValue || 0)), 0);
  const yesPositions = positions.filter(p => p.outcome?.toLowerCase() === 'yes');
  const noPositions = positions.filter(p => p.outcome?.toLowerCase() === 'no');
  const yesPct = positions.length > 0 ? (yesPositions.length / positions.length) * 100 : 0;
  const largestPosition = positions.length > 0 ? Math.max(...positions.map(p => p.currentValue)) : 0;
  const concentrationPct = totalValue > 0 ? (largestPosition / totalValue) * 100 : 0;

  // Positions table columns
  const posColumns: ColumnsType<Position> = [
    {
      title: 'Market',
      key: 'title',
      ellipsis: true,
      render: (_, r) => <Text style={{ color: '#ccc', fontSize: 11 }}>{r.title}</Text>,
    },
    {
      title: 'Side',
      key: 'outcome',
      width: 50,
      render: (_, r) => (
        <span style={{
          color: r.outcome?.toLowerCase() === 'yes' ? '#00d4aa' : '#ff4757',
          fontSize: 10,
          fontWeight: 700,
        }}>
          {r.outcome?.toUpperCase() || '--'}
        </span>
      ),
    },
    {
      title: 'Shares',
      key: 'size',
      width: 65,
      sorter: (a, b) => a.size - b.size,
      render: (_, r) => <Text style={{ color: '#999', fontSize: 11, fontFamily: 'monospace' }}>{fmtNum(r.size)}</Text>,
    },
    {
      title: 'Avg',
      key: 'avgPrice',
      width: 50,
      render: (_, r) => <Text style={{ color: '#888', fontSize: 11, fontFamily: 'monospace' }}>{(r.avgPrice * 100).toFixed(1)}¢</Text>,
    },
    {
      title: 'Price',
      key: 'curPrice',
      width: 50,
      render: (_, r) => <Text style={{ color: getProbabilityColor(r.curPrice), fontSize: 11, fontFamily: 'monospace' }}>{(r.curPrice * 100).toFixed(1)}¢</Text>,
    },
    {
      title: 'Value',
      key: 'currentValue',
      width: 65,
      sorter: (a, b) => a.currentValue - b.currentValue,
      render: (_, r) => <Text style={{ color: '#ccc', fontSize: 11, fontFamily: 'monospace' }}>{formatUsd(r.currentValue)}</Text>,
    },
    {
      title: 'P&L $',
      key: 'cashPnl',
      width: 70,
      sorter: (a, b) => a.cashPnl - b.cashPnl,
      defaultSortOrder: 'descend',
      render: (_, r) => (
        <Text style={{ color: r.cashPnl >= 0 ? '#00d4aa' : '#ff4757', fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }}>
          {r.cashPnl >= 0 ? '+' : ''}{formatUsd(r.cashPnl)}
        </Text>
      ),
    },
    {
      title: 'P&L %',
      key: 'percentPnl',
      width: 60,
      sorter: (a, b) => a.percentPnl - b.percentPnl,
      render: (_, r) => (
        <Text style={{ color: r.percentPnl >= 0 ? '#00d4aa' : '#ff4757', fontSize: 11, fontFamily: 'monospace' }}>
          {r.percentPnl >= 0 ? '+' : ''}{r.percentPnl.toFixed(1)}%
        </Text>
      ),
    },
  ];

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 8 }}>
      {/* Wallet info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ color: '#888', fontSize: 10, fontFamily: 'monospace' }}>
          {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
        </Text>
        <button
          onClick={() => { usePortfolioStore.getState().clearWallet(); setInputAddress(''); }}
          style={{ background: '#1a1a2e', color: '#888', border: 'none', borderRadius: 3, padding: '2px 8px', fontSize: 10, cursor: 'pointer' }}
        >
          Disconnect
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 8 }}>
        {summaryCards.map(card => (
          <div key={card.label} style={{ background: '#111128', borderRadius: 4, padding: '8px 10px' }}>
            <Text style={{ color: '#666', fontSize: 9, display: 'block', textTransform: 'uppercase' }}>{card.label}</Text>
            <Text style={{ color: card.color, fontSize: 16, fontWeight: 700, fontFamily: 'monospace', display: 'block' }}>{card.value}</Text>
            {card.sub && <Text style={{ color: card.color, fontSize: 10, opacity: 0.7 }}>{card.sub}</Text>}
          </div>
        ))}
      </div>

      {/* Tabs: Positions / History */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 6 }}>
        {(['positions', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? '#1a1a2e' : 'transparent',
              color: activeTab === tab ? '#ccc' : '#666',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #1668dc' : '2px solid transparent',
              padding: '4px 12px',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {tab === 'positions' ? `Positions (${positions.length})` : `Trade History (${tradeHistory.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'positions' ? (
        <>
          {/* Positions table */}
          {positions.length === 0 ? (
            <Empty description={<Text style={{ color: '#666' }}>No open positions</Text>} />
          ) : (
            <Table
              dataSource={positions}
              columns={posColumns}
              rowKey={(r) => `${r.slug}-${r.outcome}`}
              size="small"
              pagination={false}
              showSorterTooltip={false}
              style={{ marginBottom: 12 }}
            />
          )}

          {/* Bottom row: Pie chart + Risk metrics */}
          {positions.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {/* Pie chart */}
              <div style={{ background: '#111128', borderRadius: 4, padding: 8 }}>
                <Text style={{ color: '#888', fontSize: 10, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                  Portfolio Allocation
                </Text>
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={35}
                        strokeWidth={1}
                        stroke="#0d0d1a"
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div style={{ background: '#1a2030', border: '1px solid #2a3a50', borderRadius: 4, padding: '6px 10px', fontSize: 11 }}>
                              <div style={{ color: '#ccc' }}>{d.name}</div>
                              <div style={{ color: '#fff', fontWeight: 700 }}>{formatUsd(d.value)}</div>
                              <div style={{ color: d.pnl >= 0 ? '#00d4aa' : '#ff4757' }}>
                                P&L: {d.pnl >= 0 ? '+' : ''}{formatUsd(d.pnl)}
                              </div>
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Risk metrics */}
              <div style={{ background: '#111128', borderRadius: 4, padding: 8 }}>
                <Text style={{ color: '#888', fontSize: 10, display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>
                  Risk Analysis
                </Text>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {[
                    { label: 'Max Loss', value: formatUsd(maxLoss), color: '#ff4757' },
                    { label: 'Max Gain', value: formatUsd(maxGain), color: '#00d4aa' },
                    { label: 'YES Exposure', value: `${yesPct.toFixed(0)}%`, color: '#00d4aa' },
                    { label: 'NO Exposure', value: `${(100 - yesPct).toFixed(0)}%`, color: '#ff4757' },
                    { label: 'Concentration', value: `${concentrationPct.toFixed(0)}%`, color: concentrationPct > 50 ? '#ff6b6b' : '#ccc' },
                    { label: 'Positions', value: `${positions.length}`, color: '#ccc' },
                  ].map(m => (
                    <div key={m.label} style={{ padding: '4px 6px' }}>
                      <Text style={{ color: '#666', fontSize: 9, display: 'block' }}>{m.label}</Text>
                      <Text style={{ color: m.color, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>{m.value}</Text>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        // Trade history
        historyLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spin /></div>
        ) : tradeHistory.length === 0 ? (
          <Empty description={<Text style={{ color: '#666' }}>No trade history</Text>} />
        ) : (
          <Table
            dataSource={tradeHistory}
            columns={[
              { title: 'Date', key: 'timestamp', width: 120, render: (_, r) => <Text style={{ color: '#888', fontSize: 10 }}>{new Date(r.timestamp).toLocaleString()}</Text> },
              { title: 'Market', key: 'title', ellipsis: true, render: (_, r) => <Text style={{ color: '#ccc', fontSize: 11 }}>{r.title}</Text> },
              { title: 'Side', key: 'side', width: 50, render: (_, r) => <Text style={{ color: r.side === 'BUY' ? '#00d4aa' : '#ff4757', fontSize: 10, fontWeight: 700 }}>{r.side}</Text> },
              { title: 'Price', key: 'price', width: 55, render: (_, r) => <Text style={{ color: '#999', fontSize: 11, fontFamily: 'monospace' }}>{(r.price * 100).toFixed(1)}¢</Text> },
              { title: 'Size', key: 'size', width: 60, render: (_, r) => <Text style={{ color: '#999', fontSize: 11, fontFamily: 'monospace' }}>{fmtNum(r.size)}</Text> },
              { title: 'Amount', key: 'usdcAmount', width: 70, render: (_, r) => <Text style={{ color: '#ccc', fontSize: 11, fontFamily: 'monospace' }}>{formatUsd(r.usdcAmount)}</Text> },
            ]}
            rowKey={(r) => r.id}
            size="small"
            pagination={{ pageSize: 20, size: 'small' }}
            showSorterTooltip={false}
          />
        )
      )}
    </div>
  );
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}
