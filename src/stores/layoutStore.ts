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

const LAYOUT_STORAGE_KEY = 'polymarket-layout-v3';

const DEFAULT_LAYOUT: Layout[] = [
  // Left: Markets + Watchlist + Portfolio tabbed panel (full height)
  { i: 'left-panel', x: 0, y: 0, w: 3, h: 20, minW: 3, minH: 8 },
  // Center: MarketHeader + Outcomes + Chart (large)
  { i: 'center-panel', x: 3, y: 0, w: 6, h: 12, minW: 4, minH: 8 },
  // Right top: Market Info + Related Markets
  { i: 'market-info', x: 9, y: 0, w: 3, h: 12, minW: 2, minH: 6 },
  // Bottom center: Order Book + Trades + News tabs
  { i: 'book-trades-news', x: 3, y: 12, w: 3, h: 8, minW: 2, minH: 5 },
  // Bottom center: Quick Stats / Analytics
  { i: 'quick-stats', x: 6, y: 12, w: 3, h: 8, minW: 2, minH: 4 },
  // Bottom right: Top Holders
  { i: 'top-holders', x: 9, y: 12, w: 3, h: 8, minW: 2, minH: 4 },
];

function loadLayout(): Layout[] {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const keys = parsed.map((l: Layout) => l.i);
      if (keys.includes('center-panel') && keys.includes('book-trades-news')) {
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
