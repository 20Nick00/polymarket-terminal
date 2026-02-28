import { create } from 'zustand';
import type { Position, TradeHistoryEntry } from '../types/market';
import { fetchPositions, fetchTradeHistory } from '../api/data';

const WALLET_STORAGE_KEY = 'polymarket-wallet';

interface PortfolioState {
  walletAddress: string;
  positions: Position[];
  tradeHistory: TradeHistoryEntry[];
  positionsLoading: boolean;
  historyLoading: boolean;

  // Computed
  totalValue: number;
  totalPnl: number;
  totalPnlPct: number;
  unrealizedPnl: number;
  realizedPnl: number;

  // Actions
  setWallet: (address: string) => void;
  clearWallet: () => void;
  loadPositions: () => Promise<void>;
  loadTradeHistory: () => Promise<void>;
}

function loadWallet(): string {
  try {
    return localStorage.getItem(WALLET_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  walletAddress: loadWallet(),
  positions: [],
  tradeHistory: [],
  positionsLoading: false,
  historyLoading: false,
  totalValue: 0,
  totalPnl: 0,
  totalPnlPct: 0,
  unrealizedPnl: 0,
  realizedPnl: 0,

  setWallet: (address: string) => {
    localStorage.setItem(WALLET_STORAGE_KEY, address);
    set({ walletAddress: address });
    if (address) {
      get().loadPositions();
      get().loadTradeHistory();
    }
  },

  clearWallet: () => {
    localStorage.removeItem(WALLET_STORAGE_KEY);
    set({
      walletAddress: '',
      positions: [],
      tradeHistory: [],
      totalValue: 0,
      totalPnl: 0,
      totalPnlPct: 0,
      unrealizedPnl: 0,
      realizedPnl: 0,
    });
  },

  loadPositions: async () => {
    const { walletAddress } = get();
    if (!walletAddress) return;

    set({ positionsLoading: true });
    try {
      const positions = await fetchPositions(walletAddress);

      const totalValue = positions.reduce((s, p) => s + (p.currentValue || 0), 0);
      const totalPnl = positions.reduce((s, p) => s + (p.cashPnl || 0), 0);
      const totalInitial = positions.reduce((s, p) => s + (p.initialValue || 0), 0);
      const totalPnlPct = totalInitial > 0 ? (totalPnl / totalInitial) * 100 : 0;
      const unrealizedPnl = positions
        .filter(p => !p.redeemable)
        .reduce((s, p) => s + (p.cashPnl || 0), 0);
      const realizedPnl = positions.reduce((s, p) => s + (p.realizedPnl || 0), 0);

      set({
        positions,
        positionsLoading: false,
        totalValue,
        totalPnl,
        totalPnlPct,
        unrealizedPnl,
        realizedPnl,
      });
    } catch {
      set({ positionsLoading: false });
    }
  },

  loadTradeHistory: async () => {
    const { walletAddress } = get();
    if (!walletAddress) return;

    set({ historyLoading: true });
    try {
      const history = await fetchTradeHistory(walletAddress);
      set({ tradeHistory: history, historyLoading: false });
    } catch {
      set({ historyLoading: false });
    }
  },
}));
