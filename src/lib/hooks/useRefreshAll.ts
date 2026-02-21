'use client';

import { useCallback, useRef, useState } from 'react';
import { fetchStockData } from '@/lib/api/alphavantage';
import { incrementApiUsage } from '@/lib/api/api-usage';
import { clearCachedStock, setCachedStock } from '@/lib/db/indexeddb';

/** Dispatched per-symbol when fresh data is saved to IndexedDB */
export const STOCK_UPDATED_EVENT = 'stock-updated';

export interface RefreshProgress {
  isRefreshing: boolean;
  current: number;
  total: number;
  currentSymbol: string;
  remainingSeconds: number;
}

const DELAY_SECONDS = 13;

export function useRefreshAll(symbols: string[]) {
  const [progress, setProgress] = useState<RefreshProgress>({
    isRefreshing: false,
    current: 0,
    total: 0,
    currentSymbol: '',
    remainingSeconds: 0,
  });
  const abortRef = useRef(false);

  const refresh = useCallback(async () => {
    abortRef.current = false;
    const total = symbols.length;

    setProgress({
      isRefreshing: true,
      current: 0,
      total,
      currentSymbol: symbols[0],
      remainingSeconds: total * DELAY_SECONDS,
    });

    for (let i = 0; i < total; i++) {
      if (abortRef.current) break;
      const sym = symbols[i];

      setProgress({
        isRefreshing: true,
        current: i,
        total,
        currentSymbol: sym,
        remainingSeconds: (total - i) * DELAY_SECONDS,
      });

      try {
        await clearCachedStock(sym);
        const data = await fetchStockData(sym);
        incrementApiUsage();
        await setCachedStock({ ...data, cachedAt: Date.now() });

        // Notify the specific StockCard to reload from IndexedDB
        window.dispatchEvent(new CustomEvent(STOCK_UPDATED_EVENT, { detail: sym }));
      } catch {
        // Skip failed symbol, continue with next
      }
    }

    setProgress({
      isRefreshing: false,
      current: total,
      total,
      currentSymbol: '',
      remainingSeconds: 0,
    });
  }, [symbols]);

  return { progress, refresh };
}
