export const USD_JPY_RATE = 155;
export const TRADE_AMOUNT_JPY = 100_000;
export const SELL_DUE_DAYS = 30;

export interface Trade {
  id: string;
  symbol: string;
  buyDate: string;
  buyPrice: number;
  amountJpy: number;
  score: number;
  sellDate?: string;
  sellPrice?: number;
  pnlJpy?: number;
  pnlPercent?: number;
  status: 'active' | 'completed';
}

export interface TradeStore {
  version: 1;
  trades: Trade[];
  updatedAt: number;
}

export interface ActivePosition extends Trade {
  daysHeld: number;
  isSellDue: boolean;
}
