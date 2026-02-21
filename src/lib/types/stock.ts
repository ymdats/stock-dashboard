export interface DailyBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  lastTradingDay: string;
}

export interface StockData {
  symbol: string;
  bars: DailyBar[];
  quote: StockQuote;
}

export interface CachedStockEntry extends StockData {
  cachedAt: number;
}
