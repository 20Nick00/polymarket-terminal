import { create } from 'zustand';
import type { PolymarketEvent, PolymarketMarket, OrderBook, PriceHistoryPoint, NewsArticle } from '../types/market';
import type { HolderInfo } from '../api/data';
import { fetchEvents, searchEvents } from '../api/gamma';
import { fetchOrderBook, fetchPriceHistory } from '../api/clob';
import { fetchTopHolders } from '../api/data';
import { fetchNewsForMarket } from '../api/news';

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

  // Actions
  loadEvents: (params?: { tag?: string; title?: string }) => Promise<void>;
  searchMarkets: (query: string) => Promise<void>;
  setActiveTag: (tag: string) => void;
  selectEvent: (event: PolymarketEvent) => void;
  selectMarket: (market: PolymarketMarket) => void;
  loadOrderBook: (tokenId: string) => Promise<void>;
  loadPriceHistory: (tokenId: string, interval?: string) => Promise<void>;
  loadHolders: (conditionId: string) => Promise<void>;
  loadNews: (title: string) => Promise<void>;
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
    const market = event.markets?.[0];
    set({
      selectedEvent: event,
      selectedMarket: market ?? null,
      selectedTokenId: market?.clobTokenIds?.[0] ?? null,
    });
    if (market) {
      const tokenId = market.clobTokenIds?.[0];
      if (tokenId) {
        get().loadOrderBook(tokenId);
        get().loadPriceHistory(tokenId);
      }
      if (market.conditionId) {
        get().loadHolders(market.conditionId);
      }
      get().loadNews(event.title);
    }
  },

  selectMarket: (market: PolymarketMarket) => {
    const tokenId = market.clobTokenIds?.[0];
    set({ selectedMarket: market, selectedTokenId: tokenId ?? null });
    if (tokenId) {
      get().loadOrderBook(tokenId);
      get().loadPriceHistory(tokenId);
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

  loadPriceHistory: async (tokenId: string, interval = 'max') => {
    set({ priceHistoryLoading: true });
    try {
      const history = await fetchPriceHistory(tokenId, interval, 60);
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

  refreshSelectedMarketData: async () => {
    const { selectedTokenId, selectedMarket, selectedEvent } = get();
    if (selectedTokenId) {
      get().loadOrderBook(selectedTokenId);
      get().loadPriceHistory(selectedTokenId);
    }
    if (selectedMarket?.conditionId) {
      get().loadHolders(selectedMarket.conditionId);
    }
    if (selectedEvent?.title) {
      get().loadNews(selectedEvent.title);
    }
  },
}));
