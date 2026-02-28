import axios from 'axios';
import type { Position, TradeHistoryEntry } from '../types/market';

const dataApi = axios.create({
  baseURL: '/api/data',
  timeout: 15000,
});

export interface HolderInfo {
  address: string;
  amount: number;
  value: number;
  side: string;
  proxyWallet?: string;
  displayName?: string;
}

export async function fetchTopHolders(conditionId: string): Promise<HolderInfo[]> {
  try {
    const { data } = await dataApi.get('/holders', {
      params: { conditionId, limit: 20 },
    });
    return data ?? [];
  } catch {
    return [];
  }
}

export interface TradeActivity {
  id: string;
  proxyWallet: string;
  conditionId: string;
  side: string;
  size: number;
  price: number;
  timestamp: string;
  outcome: string;
}

export async function fetchMarketTrades(conditionId: string, limit = 50): Promise<TradeActivity[]> {
  try {
    const { data } = await dataApi.get('/trades', {
      params: { conditionId, limit },
    });
    return data ?? [];
  } catch {
    return [];
  }
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  displayName?: string;
  profit: number;
  volume: number;
  markets: number;
}

export async function fetchLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  try {
    const { data } = await dataApi.get('/leaderboard/profit', {
      params: { limit },
    });
    return data ?? [];
  } catch {
    return [];
  }
}

export async function fetchPositions(walletAddress: string): Promise<Position[]> {
  try {
    const { data } = await dataApi.get('/positions', {
      params: { user: walletAddress },
    });
    return data ?? [];
  } catch {
    return [];
  }
}

export async function fetchTradeHistory(walletAddress: string, limit = 100): Promise<TradeHistoryEntry[]> {
  try {
    const { data } = await dataApi.get('/activity', {
      params: { user: walletAddress, type: 'TRADE', limit },
    });
    return data ?? [];
  } catch {
    return [];
  }
}
