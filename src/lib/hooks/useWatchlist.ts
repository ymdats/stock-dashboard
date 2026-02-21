'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SYMBOLS } from '@/config/defaults';

const STORAGE_KEY = 'stock-dashboard-watchlist';

export function useWatchlist() {
  const [symbols, setSymbols] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(STORAGE_KEY);
    let list: string[] = [];

    if (stored) {
      try {
        list = JSON.parse(stored);
      } catch {
        list = [];
      }
    }

    // Merge: ensure all DEFAULT_SYMBOLS are included
    const merged = [...list];
    for (const sym of DEFAULT_SYMBOLS) {
      if (!merged.includes(sym)) {
        merged.push(sym);
      }
    }

    setSymbols(merged);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  }, []);

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

  return { symbols, removeSymbol };
}
