import axios from 'axios';
import type { OrderBook, PriceHistoryPoint, Trade } from '../types/market';

const clob = axios.create({
  baseURL: '/api/clob',
  timeout: 15000,
});

export async function fetchOrderBook(tokenId: string): Promise<OrderBook> {
  const { data } = await clob.get('/book', {
    params: { token_id: tokenId },
  });
  return data;
}

export async function fetchPrice(tokenId: string): Promise<{ bid: number; ask: number; mid: number }> {
  const { data } = await clob.get('/price', {
    params: { token_id: tokenId },
  });
  return {
    bid: parseFloat(data.bid ?? '0'),
    ask: parseFloat(data.ask ?? '0'),
    mid: parseFloat(data.mid ?? '0'),
  };
}

export async function fetchMidpoint(tokenId: string): Promise<number> {
  const { data } = await clob.get('/midpoint', {
    params: { token_id: tokenId },
  });
  return parseFloat(data.mid ?? '0');
}

export async function fetchPriceHistory(
  tokenId: string,
  interval: string = 'max',
  fidelity: number = 60,
): Promise<PriceHistoryPoint[]> {
  const { data } = await clob.get('/prices-history', {
    params: {
      market: tokenId,
      interval,
      fidelity,
    },
  });
  if (!data?.history) return [];
  return data.history.map((point: { t: number; p: number }) => ({
    t: point.t,
    o: point.p,
    h: point.p,
    l: point.p,
    c: point.p,
    v: 0,
  }));
}

export async function fetchTrades(
  tokenId: string,
  limit: number = 100,
): Promise<Trade[]> {
  const { data } = await clob.get('/trades', {
    params: { asset_id: tokenId, limit },
  });
  return data ?? [];
}

export function createMarketWebSocket(
  tokenId: string,
  onMessage: (data: unknown) => void,
): WebSocket {
  const ws = new WebSocket('wss://ws-subscriptions-clob.polymarket.com/ws/market');

  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: 'market',
      assets_id: tokenId,
    }));
  };

  ws.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      onMessage(parsed);
    } catch {
      // skip unparseable messages
    }
  };

  ws.onerror = () => {
    // reconnection handled by caller
  };

  return ws;
}
