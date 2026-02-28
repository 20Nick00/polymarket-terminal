import { Typography, Table, Empty, Spin, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMarketStore } from '../../stores/marketStore';
import type { HolderInfo } from '../../api/data';

const { Text } = Typography;

export default function TopHolders() {
  const { topHolders, holdersLoading, selectedMarket } = useMarketStore();

  if (!selectedMarket) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description={<Text style={{ color: '#666' }}>Select a market</Text>} />
      </div>
    );
  }

  if (holdersLoading && topHolders.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="small" />
      </div>
    );
  }

  const formatAddress = (addr: string) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : 'Unknown';

  const formatValue = (val: number) =>
    val >= 1000000 ? `$${(val / 1000000).toFixed(2)}M`
      : val >= 1000 ? `$${(val / 1000).toFixed(1)}K`
        : `$${val.toFixed(0)}`;

  const columns: ColumnsType<HolderInfo> = [
    {
      title: 'Address',
      key: 'address',
      render: (_, record) => (
        <Text style={{ color: '#a0a0ff', fontSize: 11, fontFamily: 'monospace' }}>
          {formatAddress(record.displayName || record.address)}
        </Text>
      ),
    },
    {
      title: 'Side',
      key: 'side',
      width: 55,
      render: (_, record) => (
        <Tag
          color={record.side === 'yes' || record.side === 'Yes' ? 'green' : 'red'}
          style={{ fontSize: 10, margin: 0 }}
        >
          {(record.side || '').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Amount',
      key: 'amount',
      width: 70,
      sorter: (a, b) => (a.amount || 0) - (b.amount || 0),
      defaultSortOrder: 'descend',
      render: (_, record) => (
        <Text style={{ color: '#ccc', fontSize: 11 }}>
          {record.amount ? record.amount.toLocaleString() : '--'}
        </Text>
      ),
    },
    {
      title: 'Value',
      key: 'value',
      width: 70,
      render: (_, record) => (
        <Text style={{ color: '#ccc', fontSize: 11 }}>
          {record.value ? formatValue(record.value) : '--'}
        </Text>
      ),
    },
  ];

  // Separate yes and no holders
  const yesHolders = topHolders.filter(h => h.side?.toLowerCase() === 'yes').slice(0, 10);
  const noHolders = topHolders.filter(h => h.side?.toLowerCase() === 'no').slice(0, 10);
  const allHolders = [...yesHolders, ...noHolders];

  if (allHolders.length === 0 && !holdersLoading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description={<Text style={{ color: '#666' }}>No holder data available</Text>} />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
        <Text style={{ color: '#52c41a', fontSize: 11 }}>
          YES holders: {yesHolders.length}
        </Text>
        <Text style={{ color: '#ff4d4f', fontSize: 11 }}>
          NO holders: {noHolders.length}
        </Text>
      </div>
      <Table
        dataSource={allHolders}
        columns={columns}
        rowKey={(record) => `${record.address}-${record.side}`}
        size="small"
        pagination={false}
        showSorterTooltip={false}
        style={{ fontSize: 11 }}
      />
    </div>
  );
}
