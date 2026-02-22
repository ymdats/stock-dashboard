'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { Trade, TradeStore, ActivePosition } from '@/lib/types/trade';
import { USD_JPY_RATE, TRADE_AMOUNT_JPY, SELL_DUE_DAYS } from '@/lib/types/trade';

function toActivePosition(t: Trade): ActivePosition {
  const daysHeld = Math.floor(
    (Date.now() - new Date(t.buyDate).getTime()) / 86_400_000,
  );
  return { ...t, daysHeld, isSellDue: daysHeld >= SELL_DUE_DAYS };
}

export function useTrades() {
  const [store, setStore] = useState<TradeStore>({
    version: 1,
    trades: [],
    updatedAt: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const storeRef = useRef(store);
  storeRef.current = store;

  useEffect(() => {
    fetch('/api/trades')
      .then((r) => r.json())
      .then((data: TradeStore) => {
        if (data.trades) setStore(data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const persist = useCallback(async (next: TradeStore) => {
    setStore(next);
    const res = await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
    if (!res.ok) throw new Error('Save failed');
  }, []);

  const recordBuy = useCallback(
    async (symbol: string, price: number, score: number) => {
      const trade: Trade = {
        id: crypto.randomUUID(),
        symbol,
        buyDate: new Date().toISOString().slice(0, 10),
        buyPrice: price,
        amountJpy: TRADE_AMOUNT_JPY,
        score,
        status: 'active',
      };
      const next: TradeStore = {
        ...storeRef.current,
        trades: [...storeRef.current.trades, trade],
      };
      try {
        await persist(next);
        toast.success(`${symbol} ¥${TRADE_AMOUNT_JPY.toLocaleString()}分 購入記録`);
      } catch {
        toast.error('保存に失敗しました');
      }
    },
    [persist],
  );

  const recordSell = useCallback(
    async (tradeId: string, sellPrice: number) => {
      const trades = storeRef.current.trades.map((t) => {
        if (t.id !== tradeId) return t;
        const pnlPercent = ((sellPrice - t.buyPrice) / t.buyPrice) * 100;
        const pnlJpy = (pnlPercent / 100) * t.amountJpy;
        return {
          ...t,
          sellDate: new Date().toISOString().slice(0, 10),
          sellPrice,
          pnlJpy: Math.round(pnlJpy),
          pnlPercent: Math.round(pnlPercent * 10) / 10,
          status: 'completed' as const,
        };
      });
      const next: TradeStore = { ...storeRef.current, trades };
      try {
        await persist(next);
        const sold = trades.find((t) => t.id === tradeId)!;
        const sign = (sold.pnlJpy ?? 0) >= 0 ? '+' : '';
        toast.success(
          `${sold.symbol} 売却 ${sign}¥${(sold.pnlJpy ?? 0).toLocaleString()} (${sign}${sold.pnlPercent}%)`,
        );
      } catch {
        toast.error('保存に失敗しました');
      }
    },
    [persist],
  );

  const activeTrades: ActivePosition[] = store.trades
    .filter((t) => t.status === 'active')
    .map(toActivePosition);

  const completedTrades: Trade[] = store.trades
    .filter((t) => t.status === 'completed')
    .sort((a, b) => (b.sellDate ?? '').localeCompare(a.sellDate ?? ''));

  return { activeTrades, completedTrades, isLoading, recordBuy, recordSell };
}
