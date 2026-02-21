'use client';

import { useWatchlist } from '@/lib/hooks/useWatchlist';
import { useRefreshAll } from '@/lib/hooks/useRefreshAll';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StockGrid } from '@/components/dashboard/StockGrid';

export default function Home() {
  const { symbols } = useWatchlist();
  const { progress, refresh } = useRefreshAll(symbols);

  return (
    <div className="h-dvh flex flex-col px-4 py-3 lg:px-6">
      <DashboardHeader
        stockCount={symbols.length}
        onRefresh={refresh}
        progress={progress}
      />
      <div className="flex-1 min-h-0 mt-3">
        <StockGrid symbols={symbols} />
      </div>
    </div>
  );
}
