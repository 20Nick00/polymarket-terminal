import { Typography, Spin, Empty } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { useMarketStore } from '../../stores/marketStore';
import { formatRelativeTime } from '../../api/helpers';

const { Text, Paragraph } = Typography;

export default function NewsPanel() {
  const { news, newsLoading, selectedEvent } = useMarketStore();

  if (!selectedEvent) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description={<Text style={{ color: '#666' }}>Select a market to see news</Text>} />
      </div>
    );
  }

  if (newsLoading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="small" />
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description={<Text style={{ color: '#666' }}>No news found</Text>} />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      {news.map((article, i) => (
        <div
          key={`${article.url}-${i}`}
          style={{
            padding: '6px 6px',
            borderBottom: '1px solid #111128',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onClick={() => window.open(article.url, '_blank')}
          onMouseEnter={(e) => e.currentTarget.style.background = '#111128'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <Paragraph
            style={{ color: '#d4d4d4', fontSize: 11, marginBottom: 2, lineHeight: '14px' }}
            ellipsis={{ rows: 2 }}
          >
            <LinkOutlined style={{ color: '#1668dc', marginRight: 4, fontSize: 10 }} />
            {article.title}
          </Paragraph>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text style={{ color: '#666', fontSize: 10 }}>{article.source}</Text>
            <Text style={{ color: '#555', fontSize: 10 }}>
              {formatRelativeTime(article.publishedAt)}
            </Text>
          </div>
        </div>
      ))}
    </div>
  );
}
