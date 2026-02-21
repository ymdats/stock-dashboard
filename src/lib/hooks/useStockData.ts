'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { StockData } from '@/lib/types/stock';
import { fetchStockData } from '@/lib/api/alphavantage';
import { incrementApiUsage } from '@/lib/api/api-usage';
import { getCachedStock, setCachedStock } from '@/lib/db/indexeddb';
import { isCacheStale } from '@/lib/utils/staleness';
import { STOCK_UPDATED_EVENT } from './useRefreshAll';

interface UseStockDataReturn {
  data: StockData | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: Date | null;
  refresh: () => Promise<void>;
}

export function useStockData(symbol: string): UseStockDataReturn {
  const [data, setData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  const fetchFresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const freshData = await fetchStockData(symbol);
      incrementApiUsage();
      if (!mountedRef.current) return;

      const now = Date.now();
      const entry = { ...freshData, cachedAt: now };
      await setCachedStock(entry);

      setData(freshData);
      setLastFetched(new Date(now));
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    mountedRef.current = true;

    async function load() {
      try {
        const cached = await getCachedStock(symbol);
        if (!mountedRef.current) return;

        if (cached && !isCacheStale(cached.cachedAt)) {
          setData(cached);
          setLastFetched(new Date(cached.cachedAt));
          setIsLoading(false);
          return;
        }

        await fetchFresh();
      } catch {
        if (mountedRef.current) {
          await fetchFresh();
        }
      }
    }

    load();

    return () => {
      mountedRef.current = false;
    };
  }, [symbol, fetchFresh]);

  // Listen for per-symbol update event (from useRefreshAll)
  useEffect(() => {
    const handler = async (e: Event) => {
      const sym = (e as CustomEvent).detail;
      if (sym !== symbol) return;
      const cached = await getCachedStock(symbol);
      if (cached) {
        setData(cached);
        setLastFetched(new Date(cached.cachedAt));
        setIsLoading(false);
        setError(null);
      }
    };
    window.addEventListener(STOCK_UPDATED_EVENT, handler);
    return () => window.removeEventListener(STOCK_UPDATED_EVENT, handler);
  }, [symbol]);

  const refresh = useCallback(async () => {
    await fetchFresh();
  }, [fetchFresh]);

  return { data, isLoading, error, lastFetched, refresh };
}
