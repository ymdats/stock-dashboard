'use client';

import type { StockQuote } from '@/lib/types/stock';
import { formatPrice, formatChange, formatPercent } from '@/lib/utils/format';

interface StockKPIProps {
  quote: StockQuote;
}

export function StockKPI({ quote }: StockKPIProps) {
  const isPositive = quote.change >= 0;
  const colorClass = isPositive ? 'text-emerald-500' : 'text-red-500';

  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-mono text-base font-bold tabular-nums">
        {formatPrice(quote.price)}
      </span>
      <span className={`font-mono text-xs tabular-nums ${colorClass}`}>
        {formatChange(quote.change)} ({formatPercent(quote.changePercent)})
      </span>
    </div>
  );
}
