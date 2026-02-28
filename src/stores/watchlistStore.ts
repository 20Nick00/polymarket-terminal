import { create } from 'zustand';
import type { WatchlistItem } from '../types/market';

const STORAGE_KEY = 'polymarket-watchlist';

function loadFromStorage(): WatchlistItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: WatchlistItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

interface WatchlistState {
  items: WatchlistItem[];
  addItem: (item: Omit<WatchlistItem, 'addedAt'>) => void;
  removeItem: (eventId: string) => void;
  isWatched: (eventId: string) => boolean;
  toggleWatch: (eventId: string, title: string, slug: string) => void;
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  items: loadFromStorage(),

  addItem: (item) => {
    const newItem = { ...item, addedAt: Date.now() };
    const updated = [...get().items, newItem];
    saveToStorage(updated);
    set({ items: updated });
  },

  removeItem: (eventId: string) => {
    const updated = get().items.filter(i => i.eventId !== eventId);
    saveToStorage(updated);
    set({ items: updated });
  },

  isWatched: (eventId: string) => {
    return get().items.some(i => i.eventId === eventId);
  },

  toggleWatch: (eventId: string, title: string, slug: string) => {
    if (get().isWatched(eventId)) {
      get().removeItem(eventId);
    } else {
      get().addItem({ eventId, title, slug });
    }
  },
}));
