'use client';

import { StockCard } from '@/components/stock/StockCard';

interface StockGridProps {
  symbols: string[];
}

export function StockGrid({ symbols }: StockGridProps) {
  return (
    <div className="h-full grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 xl:grid-rows-2 auto-rows-fr">
      {symbols.map((symbol) => (
        <StockCard key={symbol} symbol={symbol} />
      ))}
    </div>
  );
}
