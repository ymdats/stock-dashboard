'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SYMBOLS } from '@/config/defaults';

const STORAGE_KEY = 'stock-dashboard-watchlist';

export function useWatchlist() {
  const [symbols, setSymbols] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSymbols(JSON.parse(stored));
      } catch {
        setSymbols([...DEFAULT_SYMBOLS]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SYMBOLS));
      }
    } else {
      setSymbols([...DEFAULT_SYMBOLS]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SYMBOLS));
    }
  }, []);

  const persist = useCallback((next: string[]) => {
    setSymbols(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addSymbol = useCallback(
    (sym: string) => {
      const upper = sym.toUpperCase();
      setSymbols((prev) => {
        if (prev.includes(upper)) return prev;
        const next = [...prev, upper];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const removeSymbol = useCallback(
    (sym: string) => {
      const upper = sym.toUpperCase();
      setSymbols((prev) => {
        const next = prev.filter((s) => s !== upper);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  return { symbols, addSymbol, removeSymbol };
}
