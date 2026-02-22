'use client';

import { StockCard } from '@/components/stock/StockCard';
import type { ActivePosition } from '@/lib/types/trade';

interface StockGridProps {
  symbols: string[];
  activeTrades?: ActivePosition[];
  onBuy?: (symbol: string, price: number, score: number) => Promise<void>;
  onSell?: (tradeId: string, sellPrice: number) => Promise<void>;
}

export function StockGrid({ symbols, activeTrades, onBuy, onSell }: StockGridProps) {
  return (
    <div className="h-full grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 xl:grid-rows-2 auto-rows-fr">
      {symbols.map((symbol) => (
        <StockCard
          key={symbol}
          symbol={symbol}
          activeTrade={activeTrades?.find((t) => t.symbol === symbol)}
          onBuy={onBuy}
          onSell={onSell}
        />
      ))}
    </div>
  );
}
