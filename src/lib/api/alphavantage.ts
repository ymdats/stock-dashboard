import type { StockData } from '@/lib/types/stock';

export async function fetchStockData(symbol: string): Promise<StockData> {
  const res = await fetch(`/api/stock/${symbol.toUpperCase()}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch stock data');
  }
  return res.json();
}
