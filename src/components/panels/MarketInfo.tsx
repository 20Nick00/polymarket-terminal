import { Typography, Descriptions, Empty, Tag, Progress } from 'antd';
import { ClockCircleOutlined, DollarOutlined, BarChartOutlined } from '@ant-design/icons';
import { useMarketStore } from '../../stores/marketStore';

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

  let yesPrice = 0;
  let noPrice = 0;
  try {
    const prices = JSON.parse(selectedMarket.outcomePrices as unknown as string || '[]');
    yesPrice = parseFloat(prices[0] || '0');
    noPrice = parseFloat(prices[1] || '0');
  } catch {
    const prices = selectedMarket.outcomePrices;
    if (Array.isArray(prices)) {
      yesPrice = parseFloat(prices[0] || '0');
      noPrice = parseFloat(prices[1] || '0');
    }
  }

  const volume = parseFloat(selectedMarket.volume || '0');
  const liquidity = parseFloat(selectedMarket.liquidity || '0');
  const endDate = selectedMarket.endDate ? new Date(selectedMarket.endDate) : null;

  const timeRemaining = endDate
    ? getTimeRemaining(endDate)
    : 'N/A';

  const formatUsd = (val: number) =>
    val >= 1000000 ? `$${(val / 1000000).toFixed(2)}M`
      : val >= 1000 ? `$${(val / 1000).toFixed(1)}K`
        : `$${val.toFixed(0)}`;

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
          <Text style={{ color: '#52c41a', fontWeight: 700, fontSize: 16 }}>
            YES {(yesPrice * 100).toFixed(1)}¢
          </Text>
          <Text style={{ color: '#ff4d4f', fontWeight: 700, fontSize: 16 }}>
            NO {(noPrice * 100).toFixed(1)}¢
          </Text>
        </div>
        <Progress
          percent={yesPrice * 100}
          strokeColor="#52c41a"
          trailColor="#ff4d4f33"
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
        {selectedMarket.spread !== undefined && (
          <Descriptions.Item label="Spread">
            {(selectedMarket.spread * 100).toFixed(2)}¢
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* Outcomes for multi-outcome markets */}
      {selectedEvent.markets.length > 1 && (
        <div style={{ marginTop: 8 }}>
          <Text style={{ color: '#888', fontSize: 11, display: 'block', marginBottom: 4 }}>
            OUTCOMES
          </Text>
          {selectedEvent.markets.map(m => {
            let price = 0;
            try {
              const p = JSON.parse(m.outcomePrices as unknown as string || '[]');
              price = parseFloat(p[0] || '0');
            } catch {
              if (Array.isArray(m.outcomePrices) && m.outcomePrices.length > 0) {
                price = parseFloat(m.outcomePrices[0]);
              }
            }
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '3px 0',
                  borderBottom: '1px solid #1a1a2e',
                  cursor: 'pointer',
                }}
                onClick={() => useMarketStore.getState().selectMarket(m)}
              >
                <Text style={{ color: '#ccc', fontSize: 11 }} ellipsis>
                  {m.question?.slice(0, 40) || m.outcomes?.[0]}
                </Text>
                <Tag
                  color={price >= 0.5 ? 'green' : price >= 0.2 ? 'orange' : 'red'}
                  style={{ margin: 0, fontSize: 10 }}
                >
                  {(price * 100).toFixed(0)}¢
                </Tag>
              </div>
            );
          })}
        </div>
      )}

      {/* Description */}
      {selectedEvent.description && (
        <div style={{ marginTop: 10 }}>
          <Text style={{ color: '#888', fontSize: 10, display: 'block', marginBottom: 2 }}>
            RESOLUTION CRITERIA
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
