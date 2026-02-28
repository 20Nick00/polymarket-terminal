import { Typography, Descriptions, Empty, Progress } from 'antd';
import { ClockCircleOutlined, DollarOutlined, BarChartOutlined } from '@ant-design/icons';
import { useMarketStore } from '../../stores/marketStore';
import { parseOutcomePrices, formatUsd } from '../../api/helpers';

const { Text, Paragraph } = Typography;

export default function MarketInfo() {
  const { selectedEvent, selectedMarket } = useMarketStore();

  if (!selectedEvent || !selectedMarket) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description={<Text style={{ color: '#666' }}>Select a market</Text>} />
      </div>
    );
  }

  const { yes: yesPrice, no: noPrice } = parseOutcomePrices(selectedMarket.outcomePrices);

  const volume = parseFloat(selectedMarket.volume || '0');
  const liquidity = parseFloat(selectedMarket.liquidity || '0');
  const endDate = selectedMarket.endDate ? new Date(selectedMarket.endDate) : null;
  const timeRemaining = endDate ? getTimeRemaining(endDate) : 'N/A';

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '0 2px' }}>
      {/* Title */}
      <Paragraph
        style={{ color: '#e6e6e6', fontSize: 13, fontWeight: 600, marginBottom: 8 }}
        ellipsis={{ rows: 2 }}
      >
        {selectedEvent.title}
      </Paragraph>

      {/* Odds bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ color: '#00d4aa', fontWeight: 700, fontSize: 16, fontFamily: 'monospace' }}>
            YES {(yesPrice * 100).toFixed(1)}¢
          </Text>
          <Text style={{ color: '#ff4757', fontWeight: 700, fontSize: 16, fontFamily: 'monospace' }}>
            NO {(noPrice * 100).toFixed(1)}¢
          </Text>
        </div>
        <Progress
          percent={yesPrice * 100}
          strokeColor="#00d4aa"
          trailColor="rgba(255, 71, 87, 0.3)"
          showInfo={false}
          size="small"
        />
      </div>

      {/* Stats */}
      <Descriptions
        column={1}
        size="small"
        labelStyle={{ color: '#888', fontSize: 11, padding: '2px 0' }}
        contentStyle={{ color: '#ccc', fontSize: 11, padding: '2px 0' }}
      >
        <Descriptions.Item label={<><DollarOutlined /> Volume</>}>
          {formatUsd(volume)}
        </Descriptions.Item>
        <Descriptions.Item label={<><BarChartOutlined /> Liquidity</>}>
          {formatUsd(liquidity)}
        </Descriptions.Item>
        <Descriptions.Item label={<><ClockCircleOutlined /> Ends</>}>
          <Text style={{ color: '#faad14', fontSize: 11 }}>{timeRemaining}</Text>
        </Descriptions.Item>
        {selectedMarket.spread !== undefined && selectedMarket.spread > 0 && (
          <Descriptions.Item label="Spread">
            {(selectedMarket.spread * 100).toFixed(2)}¢
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* Related Markets / Outcomes */}
      {selectedEvent.markets.length > 1 && (
        <div style={{ marginTop: 10 }}>
          <Text style={{ color: '#888', fontSize: 10, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Related Markets ({selectedEvent.markets.length})
          </Text>
          {selectedEvent.markets.map(m => {
            const { yes: price } = parseOutcomePrices(m.outcomePrices);
            const isSelected = m.id === selectedMarket.id;
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 6px',
                  borderRadius: 3,
                  marginBottom: 2,
                  background: isSelected ? '#1668dc22' : '#111128',
                  border: isSelected ? '1px solid #1668dc44' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onClick={() => useMarketStore.getState().selectMarket(m)}
              >
                <Text style={{ color: isSelected ? '#e6e6e6' : '#aaa', fontSize: 11, flex: 1 }} ellipsis>
                  {m.question?.slice(0, 45) || m.outcomes?.[0]}
                </Text>
                <div style={{
                  background: price >= 0.5 ? '#00d4aa22' : price >= 0.2 ? '#faad1422' : '#ff475722',
                  color: price >= 0.5 ? '#00d4aa' : price >= 0.2 ? '#faad14' : '#ff4757',
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  padding: '1px 6px',
                  borderRadius: 3,
                  marginLeft: 8,
                  flexShrink: 0,
                }}>
                  {(price * 100).toFixed(0)}¢
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Description */}
      {selectedEvent.description && (
        <div style={{ marginTop: 10 }}>
          <Text style={{ color: '#888', fontSize: 10, display: 'block', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Resolution Criteria
          </Text>
          <Paragraph
            style={{ color: '#999', fontSize: 11, marginBottom: 0 }}
            ellipsis={{ rows: 4, expandable: true, symbol: 'more' }}
          >
            {selectedEvent.description}
          </Paragraph>
        </div>
      )}
    </div>
  );
}

function getTimeRemaining(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

  if (days > 30) return `${Math.floor(days / 30)} months`;
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  return `${hours}h ${mins}m`;
}
