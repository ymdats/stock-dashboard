'use client';

import { StockCard } from '@/components/stock/StockCard';
import type { ActivePosition } from '@/lib/types/trade';

interface StockGridProps {
  symbols: string[];
  activeTrades?: ActivePosition[];
  onBuy?: (symbol: string, price: number, score: number) => Promise<void>;
  onSell?: (tradeId: string, sellPrice: number) => Promise<void>;
  onCancel?: (tradeId: string) => Promise<void>;
}

export function StockGrid({ symbols, activeTrades, onBuy, onSell, onCancel }: StockGridProps) {
  return (
    <div className="h-full grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:grid-rows-3 auto-rows-fr">
      {symbols.map((symbol) => (
        <StockCard
          key={symbol}
          symbol={symbol}
          activeTrade={activeTrades?.find((t) => t.symbol === symbol)}
          onBuy={onBuy}
          onSell={onSell}
          onCancel={onCancel}
        />
      ))}
    </div>
  );
}
