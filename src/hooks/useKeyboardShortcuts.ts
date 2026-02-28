import { useEffect, useCallback } from 'react';
import { useMarketStore } from '../stores/marketStore';
import { useWatchlistStore } from '../stores/watchlistStore';

export function useKeyboardShortcuts() {
  const {
    events,
    selectedEvent,
    selectEvent,
    refreshSelectedMarketData,
  } = useMarketStore();
  const { toggleWatch } = useWatchlistStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't capture when typing in inputs
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow Escape to blur input
      if (e.key === 'Escape') {
        target.blur();
        e.preventDefault();
      }
      return;
    }

    // Ctrl/Cmd + K = focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.querySelector<HTMLInputElement>('.market-search-input input');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
      return;
    }

    // R = refresh data
    if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      refreshSelectedMarketData();
      return;
    }

    // W = toggle watchlist for selected event
    if (e.key === 'w' && selectedEvent) {
      e.preventDefault();
      toggleWatch(selectedEvent.id, selectedEvent.title, selectedEvent.slug);
      return;
    }

    // Escape = deselect / clear comparison
    if (e.key === 'Escape') {
      e.preventDefault();
      const { compareEvent } = useMarketStore.getState();
      if (compareEvent) {
        useMarketStore.setState({ compareEvent: null });
      } else {
        useMarketStore.setState({
          selectedEvent: null,
          selectedMarket: null,
          selectedTokenId: null,
        });
      }
      return;
    }

    // Arrow up/down = navigate markets
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (events.length === 0) return;

      const currentIdx = selectedEvent
        ? events.findIndex(ev => ev.id === selectedEvent.id)
        : -1;

      let nextIdx: number;
      if (e.key === 'ArrowDown') {
        nextIdx = currentIdx < events.length - 1 ? currentIdx + 1 : 0;
      } else {
        nextIdx = currentIdx > 0 ? currentIdx - 1 : events.length - 1;
      }

      selectEvent(events[nextIdx]);
      return;
    }
  }, [events, selectedEvent, selectEvent, refreshSelectedMarketData, toggleWatch]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
