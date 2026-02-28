import { Typography, Spin, Empty, List } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { useMarketStore } from '../../stores/marketStore';

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
        <Spin size="small" tip="Loading news..." />
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
      <List
        dataSource={news}
        size="small"
        renderItem={(article) => (
          <List.Item
            style={{
              padding: '6px 4px',
              borderBottom: '1px solid #1a1a2e',
              cursor: 'pointer',
            }}
            onClick={() => window.open(article.url, '_blank')}
          >
            <div style={{ width: '100%' }}>
              <Paragraph
                style={{ color: '#d4d4d4', fontSize: 12, marginBottom: 2, lineHeight: 1.3 }}
                ellipsis={{ rows: 2 }}
              >
                <LinkOutlined style={{ color: '#1668dc', marginRight: 4, fontSize: 10 }} />
                {article.title}
              </Paragraph>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ color: '#666', fontSize: 10 }}>{article.source}</Text>
                <Text style={{ color: '#555', fontSize: 10 }}>
                  {formatTime(article.publishedAt)}
                </Text>
              </div>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHrs < 1) return `${Math.floor(diffMs / (1000 * 60))}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}
