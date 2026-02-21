'use client';

import { useWatchlist } from '@/lib/hooks/useWatchlist';
import { useRefreshAll } from '@/lib/hooks/useRefreshAll';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StockGrid } from '@/components/dashboard/StockGrid';

export default function Home() {
  const { symbols } = useWatchlist();
  const { progress, refresh } = useRefreshAll(symbols);

  return (
    <div className="px-4 py-4 space-y-4 lg:px-6">
      <DashboardHeader
        stockCount={symbols.length}
        onRefresh={refresh}
        progress={progress}
      />
      <StockGrid symbols={symbols} />
    </div>
  );
}
