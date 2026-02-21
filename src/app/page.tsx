'use client';

import { useWatchlist } from '@/lib/hooks/useWatchlist';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StockGrid } from '@/components/dashboard/StockGrid';

export default function Home() {
  const { symbols } = useWatchlist();

  return (
    <div className="px-4 py-4 space-y-4 lg:px-6">
      <DashboardHeader stockCount={symbols.length} />
      <StockGrid symbols={symbols} />
    </div>
  );
}
