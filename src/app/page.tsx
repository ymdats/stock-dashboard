'use client';

import { useWatchlist } from '@/lib/hooks/useWatchlist';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StockGrid } from '@/components/dashboard/StockGrid';

export default function Home() {
  const { symbols, addSymbol, removeSymbol } = useWatchlist();

  return (
    <div className="px-4 py-6 space-y-6 lg:px-6">
      <DashboardHeader stockCount={symbols.length} onAddStock={addSymbol} />
      <StockGrid symbols={symbols} onRemoveStock={removeSymbol} />
    </div>
  );
}
