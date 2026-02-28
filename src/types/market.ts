export interface PolymarketEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  liquidity: number;
  volume: number;
  markets: PolymarketMarket[];
  tags?: string[];
  image?: string;
}

export interface PolymarketMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  endDate: string;
  liquidity: string;
  volume: string;
  volume24hr: number;
  active: boolean;
  closed: boolean;
  outcomes: string[];
  outcomePrices: string[];
  clobTokenIds: string[];
  bestBid: number;
  bestAsk: number;
  lastTradePrice: number;
  spread: number;
  image?: string;
  description?: string;
  tags?: { label: string }[];
}

export interface OrderBookEntry {
  price: string;
  size: string;
}

export interface OrderBook {
  market: string;
  asset_id: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  hash: string;
  timestamp: string;
}

export interface PriceHistoryPoint {
  t: number; // timestamp
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
}

export interface Trade {
  id: string;
  taker_order_id: string;
  market: string;
  asset_id: string;
  side: 'BUY' | 'SELL';
  size: string;
  price: string;
  timestamp: string;
  status: string;
}

export interface MarketHolder {
  address: string;
  positions: number;
  value: number;
  pnl: number;
  side: 'yes' | 'no';
}

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  image?: string;
}

export interface WatchlistItem {
  eventId: string;
  title: string;
  slug: string;
  addedAt: number;
}
