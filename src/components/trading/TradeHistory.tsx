'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils/format';
import type { Trade } from '@/lib/types/trade';

interface TradeHistoryProps {
  trades: Trade[];
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  if (trades.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          まだ完了した取引がありません
        </CardContent>
      </Card>
    );
  }

  const totalPnl = trades.reduce((s, t) => s + (t.pnlJpy ?? 0), 0);
  const totalSign = totalPnl >= 0 ? '+' : '';

  return (
    <Card>
      <CardContent className="p-0">
        <div className="px-4 py-2 border-b flex items-center justify-between">
          <h3 className="text-sm font-semibold">取引履歴 ({trades.length}件)</h3>
          <span className={`text-sm font-bold font-mono tabular-nums ${totalPnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            合計 {totalSign}¥{totalPnl.toLocaleString()}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left px-4 py-2 font-medium">銘柄</th>
                <th className="text-left px-2 py-2 font-medium">買日</th>
                <th className="text-left px-2 py-2 font-medium">売日</th>
                <th className="text-right px-2 py-2 font-medium">買値</th>
                <th className="text-right px-2 py-2 font-medium">売値</th>
                <th className="text-right px-2 py-2 font-medium">損益(¥)</th>
                <th className="text-right px-4 py-2 font-medium">損益(%)</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => {
                const pnl = t.pnlJpy ?? 0;
                const pct = t.pnlPercent ?? 0;
                const color = pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
                const sign = pnl >= 0 ? '+' : '';
                return (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-mono font-semibold">{t.symbol}</td>
                    <td className="px-2 py-2 font-mono tabular-nums">{t.buyDate}</td>
                    <td className="px-2 py-2 font-mono tabular-nums">{t.sellDate ?? '-'}</td>
                    <td className="text-right px-2 py-2 font-mono tabular-nums">{formatPrice(t.buyPrice)}</td>
                    <td className="text-right px-2 py-2 font-mono tabular-nums">{t.sellPrice ? formatPrice(t.sellPrice) : '-'}</td>
                    <td className={`text-right px-2 py-2 font-mono tabular-nums font-bold ${color}`}>
                      {sign}¥{pnl.toLocaleString()}
                    </td>
                    <td className={`text-right px-4 py-2 font-mono tabular-nums ${color}`}>
                      {sign}{pct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
