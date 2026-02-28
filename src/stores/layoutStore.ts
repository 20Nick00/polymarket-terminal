import { create } from 'zustand';

interface Layout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}

const LAYOUT_STORAGE_KEY = 'polymarket-layout-v2';

const DEFAULT_LAYOUT: Layout[] = [
  // Left: Markets + Watchlist tabbed panel (full height)
  { i: 'left-panel', x: 0, y: 0, w: 3, h: 20, minW: 3, minH: 8 },
  // Center top: Chart
  { i: 'chart', x: 3, y: 0, w: 6, h: 10, minW: 4, minH: 6 },
  // Right top: Market Info
  { i: 'market-info', x: 9, y: 0, w: 3, h: 10, minW: 2, minH: 5 },
  // Center bottom-left: Order Book + News tabs
  { i: 'order-book-news', x: 3, y: 10, w: 3, h: 10, minW: 2, minH: 6 },
  // Center bottom-middle: Trade Ticker
  { i: 'trade-ticker', x: 6, y: 10, w: 3, h: 10, minW: 2, minH: 5 },
  // Right bottom-top: Top Holders
  { i: 'top-holders', x: 9, y: 10, w: 3, h: 5, minW: 2, minH: 4 },
  // Right bottom-bottom: Quick Stats
  { i: 'quick-stats', x: 9, y: 15, w: 3, h: 5, minW: 2, minH: 4 },
];

function loadLayout(): Layout[] {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Validate that it has the new panel keys
      const keys = parsed.map((l: Layout) => l.i);
      if (keys.includes('left-panel') && keys.includes('order-book-news')) {
        return parsed;
      }
    }
    return DEFAULT_LAYOUT;
  } catch {
    return DEFAULT_LAYOUT;
  }
}

function saveLayout(layout: Layout[]) {
  localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
}

interface LayoutState {
  layout: Layout[];
  setLayout: (layout: Layout[]) => void;
  resetLayout: () => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  layout: loadLayout(),

  setLayout: (layout: Layout[]) => {
    saveLayout(layout);
    set({ layout });
  },

  resetLayout: () => {
    saveLayout(DEFAULT_LAYOUT);
    set({ layout: DEFAULT_LAYOUT });
  },
}));
