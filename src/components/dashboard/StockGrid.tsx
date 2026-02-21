'use client';

import { StockCard } from '@/components/stock/StockCard';

interface StockGridProps {
  symbols: string[];
  onRemoveStock: (symbol: string) => void;
}

export function StockGrid({ symbols, onRemoveStock }: StockGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {symbols.map((symbol) => (
        <StockCard key={symbol} symbol={symbol} onRemove={onRemoveStock} />
      ))}
    </div>
  );
}
