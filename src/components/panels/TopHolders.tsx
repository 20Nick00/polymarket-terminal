import { Typography, Empty, Spin, Tag } from 'antd';
import { useMarketStore } from '../../stores/marketStore';

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

  const yesHolders = topHolders.filter(h => h.side?.toLowerCase() === 'yes').slice(0, 10);
  const noHolders = topHolders.filter(h => h.side?.toLowerCase() === 'no').slice(0, 10);
  const allHolders = [...yesHolders, ...noHolders].sort((a, b) => (b.amount || 0) - (a.amount || 0));

  if (allHolders.length === 0 && !holdersLoading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description={<Text style={{ color: '#666' }}>No holder data available</Text>} />
      </div>
    );
  }

  const maxAmount = Math.max(...allHolders.map(h => h.amount || 0), 1);

  const fmtAddr = (addr: string, name?: string) => {
    if (name && name !== addr) return name.length > 16 ? name.slice(0, 16) + '…' : name;
    return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : 'Unknown';
  };

  const fmtAmount = (val: number) =>
    val >= 1_000_000 ? `${(val / 1_000_000).toFixed(1)}M`
      : val >= 1_000 ? `${(val / 1_000).toFixed(1)}K`
        : val.toFixed(0);

  const fmtValue = (val: number) =>
    val >= 1_000_000 ? `$${(val / 1_000_000).toFixed(1)}M`
      : val >= 1_000 ? `$${(val / 1_000).toFixed(1)}K`
        : `$${val.toFixed(0)}`;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontSize: 11 }}>
      {/* Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px 4px', borderBottom: '1px solid #1a1a2e' }}>
        <Text style={{ color: '#00d4aa', fontSize: 10, fontWeight: 600 }}>
          YES: {yesHolders.length}
        </Text>
        <Text style={{ color: '#ff4757', fontSize: 10, fontWeight: 600 }}>
          NO: {noHolders.length}
        </Text>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', padding: '3px 4px', borderBottom: '1px solid #1a1a2e' }}>
        <Text style={{ color: '#555', fontSize: 9, flex: 1, textTransform: 'uppercase' }}>Holder</Text>
        <Text style={{ color: '#555', fontSize: 9, width: 42, textAlign: 'center', textTransform: 'uppercase' }}>Side</Text>
        <Text style={{ color: '#555', fontSize: 9, width: 55, textAlign: 'right', textTransform: 'uppercase' }}>Shares</Text>
        <Text style={{ color: '#555', fontSize: 9, width: 55, textAlign: 'right', textTransform: 'uppercase' }}>Value</Text>
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {allHolders.map((holder, i) => {
          const isYes = holder.side?.toLowerCase() === 'yes';
          const barPct = ((holder.amount || 0) / maxAmount) * 100;
          return (
            <div
              key={`${holder.address}-${holder.side}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '2px 4px',
                position: 'relative',
                borderBottom: '1px solid #111128',
              }}
            >
              {/* Depth bar */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${barPct}%`,
                background: isYes ? 'rgba(0, 212, 170, 0.06)' : 'rgba(255, 71, 87, 0.06)',
              }} />

              {/* Rank + Address */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, zIndex: 1, minWidth: 0 }}>
                <span style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: isYes ? '#00d4aa22' : '#ff475722',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: '#888', flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                <Text style={{ color: '#a0a0ff', fontSize: 11, fontFamily: 'monospace' }} ellipsis>
                  {fmtAddr(holder.address, holder.displayName)}
                </Text>
              </div>

              {/* Side badge */}
              <div style={{ width: 42, textAlign: 'center', zIndex: 1 }}>
                <Tag
                  color={isYes ? '#00d4aa' : '#ff4757'}
                  style={{ fontSize: 9, margin: 0, padding: '0 4px', lineHeight: '16px', border: 'none' }}
                >
                  {isYes ? 'YES' : 'NO'}
                </Tag>
              </div>

              {/* Shares */}
              <Text style={{ color: '#ccc', fontSize: 11, width: 55, textAlign: 'right', fontFamily: 'monospace', zIndex: 1 }}>
                {holder.amount ? fmtAmount(holder.amount) : '--'}
              </Text>

              {/* Value */}
              <Text style={{ color: '#999', fontSize: 11, width: 55, textAlign: 'right', fontFamily: 'monospace', zIndex: 1 }}>
                {holder.value ? fmtValue(holder.value) : '--'}
              </Text>
            </div>
          );
        })}
      </div>
    </div>
  );
}
