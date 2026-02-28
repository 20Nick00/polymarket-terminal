import { useState } from 'react';
import { useMarketStore } from '../../stores/marketStore';
import MarketHeader from './MarketHeader';
import OutcomesList from './OutcomesList';
import PriceChart from './PriceChart';
import ComparisonView from './ComparisonView';

export default function CenterPanel() {
  const { selectedEvent, compareEvent } = useMarketStore();
  const [overlayAll, setOverlayAll] = useState(false);

  const isMultiOutcome = selectedEvent && selectedEvent.markets.length > 1;

  // Show comparison view when comparing two markets
  if (compareEvent) {
    return <ComparisonView />;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Market Header */}
      <MarketHeader />

      {/* Outcomes + Chart area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Outcomes sidebar for multi-outcome */}
        {isMultiOutcome && (
          <OutcomesList
            overlayAll={overlayAll}
            onOverlayToggle={() => setOverlayAll(v => !v)}
          />
        )}

        {/* Chart */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <PriceChart overlayAll={overlayAll && !!isMultiOutcome} />
        </div>
      </div>
    </div>
  );
}
