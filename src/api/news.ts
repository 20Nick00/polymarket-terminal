import type { NewsArticle } from '../types/market';

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

function extractKeywords(title: string): string {
  const stopWords = new Set([
    'will', 'the', 'be', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of',
    'by', 'with', 'is', 'are', 'was', 'were', 'has', 'have', 'had', 'do',
    'does', 'did', 'but', 'and', 'or', 'not', 'no', 'so', 'if', 'than',
    'that', 'this', 'these', 'those', 'it', 'its', 'as', 'from', 'into',
    'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how', 'before',
    'after', 'above', 'below', 'between', 'during', 'through', 'about',
    'yes', 'no', 'win', 'lose', 'over', 'under', 'more', 'most', 'any',
  ]);

  return title
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word.toLowerCase()))
    .slice(0, 5)
    .join(' ');
}

function parseRSSItems(xml: string): NewsArticle[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const items = doc.querySelectorAll('item');
  const articles: NewsArticle[] = [];

  items.forEach((item) => {
    const title = item.querySelector('title')?.textContent ?? '';
    const link = item.querySelector('link')?.textContent ?? '';
    const pubDate = item.querySelector('pubDate')?.textContent ?? '';
    const source = item.querySelector('source')?.textContent ?? 'Google News';
    const description = item.querySelector('description')?.textContent ?? '';

    if (title && link) {
      articles.push({
        title: title.replace(/<[^>]*>/g, ''),
        description: description.replace(/<[^>]*>/g, '').slice(0, 200),
        url: link,
        source,
        publishedAt: pubDate,
      });
    }
  });

  return articles;
}

export async function fetchNewsForMarket(marketTitle: string): Promise<NewsArticle[]> {
  const keywords = extractKeywords(marketTitle);
  if (!keywords.trim()) return [];

  const googleNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(keywords)}&hl=en-US&gl=US&ceid=US:en`;

  try {
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(googleNewsUrl)}`);
    if (!response.ok) throw new Error('RSS fetch failed');
    const xml = await response.text();
    return parseRSSItems(xml).slice(0, 15);
  } catch {
    // Fallback: try without proxy
    try {
      const response = await fetch(googleNewsUrl);
      if (!response.ok) return [];
      const xml = await response.text();
      return parseRSSItems(xml).slice(0, 15);
    } catch {
      return [];
    }
  }
}
