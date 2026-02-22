'use client';

import { ActivePositions } from './ActivePositions';
import { PnlChart } from './PnlChart';
import { TradeHistory } from './TradeHistory';
import type { ActivePosition, Trade } from '@/lib/types/trade';

interface TradingViewProps {
  activeTrades: ActivePosition[];
  completedTrades: Trade[];
  onSell: (tradeId: string, sellPrice: number) => Promise<void>;
}

export function TradingView({ activeTrades, completedTrades, onSell }: TradingViewProps) {
  return (
    <div className="h-full flex flex-col gap-4 overflow-auto">
      <ActivePositions positions={activeTrades} onSell={onSell} />
      <PnlChart trades={completedTrades} />
      <TradeHistory trades={completedTrades} />
    </div>
  );
}
