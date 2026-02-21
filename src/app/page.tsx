'use client';

import { useCallback, useState } from 'react';
import { useWatchlist } from '@/lib/hooks/useWatchlist';
import { REFRESH_EVENT } from '@/lib/hooks/useStockData';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StockGrid } from '@/components/dashboard/StockGrid';

export default function Home() {
  const { symbols } = useWatchlist();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    window.dispatchEvent(new Event(REFRESH_EVENT));
    // Reset after enough time for the queue to finish
    // 6 stocks × 13s delay = ~78s
    setTimeout(() => setIsRefreshing(false), 80_000);
  }, []);

  return (
    <div className="px-4 py-4 space-y-4 lg:px-6">
      <DashboardHeader
        stockCount={symbols.length}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      <StockGrid symbols={symbols} />
    </div>
  );
}
