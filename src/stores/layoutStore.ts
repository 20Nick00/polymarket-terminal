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

const LAYOUT_STORAGE_KEY = 'polymarket-layout';

const DEFAULT_LAYOUT: Layout[] = [
  { i: 'market-browser', x: 0, y: 0, w: 4, h: 14, minW: 3, minH: 6 },
  { i: 'chart', x: 4, y: 0, w: 5, h: 8, minW: 3, minH: 5 },
  { i: 'market-info', x: 9, y: 0, w: 3, h: 8, minW: 2, minH: 4 },
  { i: 'order-book', x: 4, y: 8, w: 3, h: 6, minW: 2, minH: 4 },
  { i: 'news', x: 7, y: 8, w: 3, h: 6, minW: 2, minH: 4 },
  { i: 'watchlist', x: 10, y: 8, w: 2, h: 6, minW: 2, minH: 3 },
  { i: 'top-holders', x: 0, y: 14, w: 4, h: 6, minW: 2, minH: 4 },
];

function loadLayout(): Layout[] {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_LAYOUT;
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
