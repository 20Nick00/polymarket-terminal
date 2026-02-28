import { create } from 'zustand';
import type { PolymarketEvent, PolymarketMarket, OrderBook, PriceHistoryPoint, NewsArticle, Trade } from '../types/market';
import type { HolderInfo } from '../api/data';
import { fetchEvents, searchEvents } from '../api/gamma';
import { fetchOrderBook, fetchPriceHistory, fetchTrades } from '../api/clob';
import { fetchTopHolders } from '../api/data';
import { fetchNewsForMarket } from '../api/news';
import { getYesTokenId, parseJsonArray as parseJsonArrayLocal } from '../api/helpers';

interface MarketState {
  // Events list
  events: PolymarketEvent[];
  eventsLoading: boolean;
  searchQuery: string;
  activeTag: string;

  // Selected market
  selectedEvent: PolymarketEvent | null;
  selectedMarket: PolymarketMarket | null;
  selectedTokenId: string | null;

  // Market detail data
  orderBook: OrderBook | null;
  orderBookLoading: boolean;
  priceHistory: PriceHistoryPoint[];
  priceHistoryLoading: boolean;
  topHolders: HolderInfo[];
  holdersLoading: boolean;
  news: NewsArticle[];
  newsLoading: boolean;
  trades: Trade[];
  tradesLoading: boolean;

  // Comparison
  compareEvent: PolymarketEvent | null;

  // Actions
  loadEvents: (params?: { tag?: string; title?: string }) => Promise<void>;
  searchMarkets: (query: string) => Promise<void>;
  setActiveTag: (tag: string) => void;
  selectEvent: (event: PolymarketEvent) => void;
  selectMarket: (market: PolymarketMarket) => void;
  setCompareEvent: (event: PolymarketEvent | null) => void;
  loadOrderBook: (tokenId: string) => Promise<void>;
  loadPriceHistory: (tokenId: string, interval?: string, fidelity?: number) => Promise<void>;
  loadHolders: (conditionId: string) => Promise<void>;
  loadNews: (title: string) => Promise<void>;
  loadTrades: (tokenId: string) => Promise<void>;
  refreshSelectedMarketData: () => Promise<void>;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  events: [],
  eventsLoading: false,
  searchQuery: '',
  activeTag: '',

  selectedEvent: null,
  selectedMarket: null,
  selectedTokenId: null,

  orderBook: null,
  orderBookLoading: false,
  priceHistory: [],
  priceHistoryLoading: false,
  topHolders: [],
  holdersLoading: false,
  news: [],
  newsLoading: false,
  trades: [],
  tradesLoading: false,
  compareEvent: null,

  loadEvents: async (params) => {
    set({ eventsLoading: true });
    try {
      const events = await fetchEvents({
        limit: 50,
        active: true,
        tag: params?.tag,
        title: params?.title,
      });
      set({ events, eventsLoading: false });
    } catch {
      set({ eventsLoading: false });
    }
  },

  searchMarkets: async (query: string) => {
    set({ searchQuery: query, eventsLoading: true });
    try {
      if (!query.trim()) {
        const events = await fetchEvents({ limit: 50, active: true });
        set({ events, eventsLoading: false });
      } else {
        const events = await searchEvents(query);
        set({ events, eventsLoading: false });
      }
    } catch {
      set({ eventsLoading: false });
    }
  },

  setActiveTag: (tag: string) => {
    set({ activeTag: tag });
    get().loadEvents({ tag: tag || undefined });
  },

  selectEvent: (event: PolymarketEvent) => {
    // Find the first market with a real price (not 0 or 1), fallback to first market
    const market = event.markets?.find(m => {
      const prices = parseJsonArrayLocal(m.outcomePrices);
      const p = parseFloat(prices[0] || '0');
      return p > 0.01 && p < 0.99;
    }) ?? event.markets?.[0];

    const tokenId = market ? getYesTokenId(market.clobTokenIds) : null;
    set({
      selectedEvent: event,
      selectedMarket: market ?? null,
      selectedTokenId: tokenId,
    });
    if (market) {
      if (tokenId) {
        get().loadOrderBook(tokenId);
        get().loadPriceHistory(tokenId);
        get().loadTrades(tokenId);
      }
      if (market.conditionId) {
        get().loadHolders(market.conditionId);
      }
      get().loadNews(event.title);
    }
  },

  selectMarket: (market: PolymarketMarket) => {
    const tokenId = getYesTokenId(market.clobTokenIds);
    set({ selectedMarket: market, selectedTokenId: tokenId });
    if (tokenId) {
      get().loadOrderBook(tokenId);
      get().loadPriceHistory(tokenId);
      get().loadTrades(tokenId);
    }
    if (market.conditionId) {
      get().loadHolders(market.conditionId);
    }
  },

  loadOrderBook: async (tokenId: string) => {
    set({ orderBookLoading: true });
    try {
      const orderBook = await fetchOrderBook(tokenId);
      set({ orderBook, orderBookLoading: false });
    } catch {
      set({ orderBook: null, orderBookLoading: false });
    }
  },

  loadPriceHistory: async (tokenId: string, interval = 'max', fidelity = 720) => {
    set({ priceHistoryLoading: true });
    try {
      const history = await fetchPriceHistory(tokenId, interval, fidelity);
      set({ priceHistory: history, priceHistoryLoading: false });
    } catch {
      set({ priceHistory: [], priceHistoryLoading: false });
    }
  },

  loadHolders: async (conditionId: string) => {
    set({ holdersLoading: true });
    try {
      const holders = await fetchTopHolders(conditionId);
      set({ topHolders: holders, holdersLoading: false });
    } catch {
      set({ topHolders: [], holdersLoading: false });
    }
  },

  loadNews: async (title: string) => {
    set({ newsLoading: true });
    try {
      const articles = await fetchNewsForMarket(title);
      set({ news: articles, newsLoading: false });
    } catch {
      set({ news: [], newsLoading: false });
    }
  },

  setCompareEvent: (event: PolymarketEvent | null) => {
    set({ compareEvent: event });
  },

  loadTrades: async (tokenId: string) => {
    set({ tradesLoading: true });
    try {
      const trades = await fetchTrades(tokenId, 50);
      set({ trades, tradesLoading: false });
    } catch {
      set({ trades: [], tradesLoading: false });
    }
  },

  refreshSelectedMarketData: async () => {
    const { selectedTokenId, selectedMarket, selectedEvent } = get();
    if (selectedTokenId) {
      get().loadOrderBook(selectedTokenId);
      get().loadPriceHistory(selectedTokenId);
      get().loadTrades(selectedTokenId);
    }
    if (selectedMarket?.conditionId) {
      get().loadHolders(selectedMarket.conditionId);
    }
    if (selectedEvent?.title) {
      get().loadNews(selectedEvent.title);
    }
  },
}));
