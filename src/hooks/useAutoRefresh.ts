import { useEffect, useRef, useState } from 'react';
import { useMarketStore } from '../stores/marketStore';

/**
 * Auto-refresh hook that manages all data refresh intervals.
 * Returns the time since last refresh.
 */
export function useAutoRefresh() {
  const {
    selectedTokenId,
    selectedMarket,
    selectedEvent,
    loadOrderBook,
    loadPriceHistory,
    loadTrades,
    loadHolders,
    loadNews,
    loadEvents,
  } = useMarketStore();

  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Market list: every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      loadEvents();
    }, 30000);
    return () => clearInterval(timer);
  }, [loadEvents]);

  // Order book: every 3 seconds
  useEffect(() => {
    if (!selectedTokenId) return;
    const timer = setInterval(() => {
      loadOrderBook(selectedTokenId);
    }, 3000);
    return () => clearInterval(timer);
  }, [selectedTokenId, loadOrderBook]);

  // Price chart: every 60 seconds
  useEffect(() => {
    if (!selectedTokenId) return;
    const timer = setInterval(() => {
      loadPriceHistory(selectedTokenId);
      setLastRefresh(Date.now());
    }, 60000);
    return () => clearInterval(timer);
  }, [selectedTokenId, loadPriceHistory]);

  // Trades: every 10 seconds
  useEffect(() => {
    if (!selectedTokenId) return;
    const timer = setInterval(() => {
      loadTrades(selectedTokenId);
    }, 10000);
    return () => clearInterval(timer);
  }, [selectedTokenId, loadTrades]);

  // Holders: every 5 minutes
  useEffect(() => {
    if (!selectedMarket?.conditionId) return;
    const timer = setInterval(() => {
      loadHolders(selectedMarket.conditionId);
    }, 300000);
    return () => clearInterval(timer);
  }, [selectedMarket?.conditionId, loadHolders]);

  // News: every 5 minutes
  useEffect(() => {
    if (!selectedEvent?.title) return;
    const timer = setInterval(() => {
      loadNews(selectedEvent.title);
    }, 300000);
    return () => clearInterval(timer);
  }, [selectedEvent?.title, loadNews]);

  // Update seconds counter
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastRefresh) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastRefresh]);

  return { secondsAgo, lastRefresh };
}
