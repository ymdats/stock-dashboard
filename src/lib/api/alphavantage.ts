import type { StockData } from '@/lib/types/stock';
import { enqueue } from './fetch-queue';

async function _fetchStockData(symbol: string): Promise<StockData> {
  const res = await fetch(`/api/stock/${symbol.toUpperCase()}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch stock data');
  }
  return res.json();
}

export function fetchStockData(symbol: string): Promise<StockData> {
  return enqueue(() => _fetchStockData(symbol));
}
