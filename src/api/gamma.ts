import axios from 'axios';
import type { PolymarketEvent, PolymarketMarket } from '../types/market';

const gamma = axios.create({
  baseURL: '/api/gamma',
  timeout: 15000,
});

export interface EventsParams {
  limit?: number;
  offset?: number;
  order?: string;
  ascending?: boolean;
  active?: boolean;
  closed?: boolean;
  tag?: string;
  title?: string;
}

export async function fetchEvents(params: EventsParams = {}): Promise<PolymarketEvent[]> {
  const { data } = await gamma.get('/events', {
    params: {
      limit: params.limit ?? 50,
      offset: params.offset ?? 0,
      order: params.order ?? 'volume24hr',
      ascending: params.ascending ?? false,
      active: params.active ?? true,
      closed: params.closed ?? false,
      ...(params.tag && { tag: params.tag }),
      ...(params.title && { title: params.title }),
    },
  });
  return data;
}

export async function fetchEvent(id: string): Promise<PolymarketEvent> {
  const { data } = await gamma.get(`/events/${id}`);
  return data;
}

export async function fetchMarkets(params: {
  limit?: number;
  offset?: number;
  active?: boolean;
} = {}): Promise<PolymarketMarket[]> {
  const { data } = await gamma.get('/markets', {
    params: {
      limit: params.limit ?? 100,
      offset: params.offset ?? 0,
      active: params.active ?? true,
    },
  });
  return data;
}

export async function fetchMarket(id: string): Promise<PolymarketMarket> {
  const { data } = await gamma.get(`/markets/${id}`);
  return data;
}

export async function searchEvents(query: string): Promise<PolymarketEvent[]> {
  const { data } = await gamma.get('/events', {
    params: {
      title: query,
      limit: 50,
      active: true,
      order: 'volume24hr',
      ascending: false,
    },
  });
  return data;
}
