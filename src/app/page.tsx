'use client';

import { useState } from 'react';
import { useWatchlist } from '@/lib/hooks/useWatchlist';
import { useRefreshAll } from '@/lib/hooks/useRefreshAll';
import { useTrades } from '@/lib/hooks/useTrades';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StockGrid } from '@/components/dashboard/StockGrid';
import { TradingView } from '@/components/trading/TradingView';

type View = 'dashboard' | 'portfolio';

export default function Home() {
  const [view, setView] = useState<View>('dashboard');
  const { symbols } = useWatchlist();
  const { progress, refresh } = useRefreshAll(symbols);
  const { activeTrades, completedTrades, recordBuy, recordSell, cancelTrade } = useTrades();

  return (
    <div className="h-dvh flex flex-col px-4 py-3 lg:px-6">
      <DashboardHeader
        stockCount={symbols.length}
        onRefresh={refresh}
        progress={progress}
        view={view}
        onViewChange={setView}
        activeTradeCount={activeTrades.length}
      />
      <div className="flex-1 min-h-0 mt-3">
        {view === 'dashboard' ? (
          <StockGrid
            symbols={symbols}
            activeTrades={activeTrades}
            onBuy={recordBuy}
            onSell={recordSell}
            onCancel={cancelTrade}
          />
        ) : (
          <TradingView
            activeTrades={activeTrades}
            completedTrades={completedTrades}
            onSell={recordSell}
            onCancel={cancelTrade}
          />
        )}
      </div>
    </div>
  );
}
