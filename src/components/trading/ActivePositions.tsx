'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { formatPrice } from '@/lib/utils/format';
import type { ActivePosition } from '@/lib/types/trade';

interface ActivePositionsProps {
  positions: ActivePosition[];
  onSell: (tradeId: string, sellPrice: number) => Promise<void>;
  onCancel: (tradeId: string) => Promise<void>;
}

function SellDialog({
  position,
  onSell,
}: {
  position: ActivePosition;
  onSell: (tradeId: string, sellPrice: number) => Promise<void>;
}) {
  const [price, setPrice] = useState(position.buyPrice.toFixed(2));
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const sellPrice = parseFloat(price) || 0;
  const pnlPct = sellPrice > 0 ? ((sellPrice - position.buyPrice) / position.buyPrice) * 100 : 0;
  const pnlJpy = Math.round((pnlPct / 100) * position.amountJpy);
  const sign = pnlJpy >= 0 ? '+' : '';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={position.isSellDue ? 'destructive' : 'outline'}
          size="sm"
          className="h-7 text-xs"
        >
          売り記録
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{position.symbol} 売却確認</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>保有: {position.daysHeld}日</span>
            <span>買値: {formatPrice(position.buyPrice)}</span>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">売値 (USD)</label>
            <Input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="font-mono tabular-nums"
            />
          </div>
          <div className={`text-center text-lg font-bold font-mono tabular-nums ${pnlJpy >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {sign}¥{pnlJpy.toLocaleString()} ({sign}{pnlPct.toFixed(1)}%)
          </div>
          <Button
            className="w-full"
            disabled={sellPrice <= 0 || saving}
            onClick={async () => {
              setSaving(true);
              await onSell(position.id, sellPrice);
              setSaving(false);
              setOpen(false);
            }}
          >
            {saving ? '保存中...' : '売却を記録'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ActivePositions({ positions, onSell, onCancel }: ActivePositionsProps) {
  if (positions.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          保有中のポジションはありません
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="px-4 py-2 border-b">
          <h3 className="text-sm font-semibold">保有中 ({positions.length}件)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left px-4 py-2 font-medium">銘柄</th>
                <th className="text-left px-2 py-2 font-medium">買日</th>
                <th className="text-right px-2 py-2 font-medium">保有</th>
                <th className="text-right px-2 py-2 font-medium">買値</th>
                <th className="text-left px-2 py-2 font-medium">状態</th>
                <th className="text-right px-4 py-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="px-4 py-2 font-mono font-semibold">{p.symbol}</td>
                  <td className="px-2 py-2 font-mono tabular-nums">{p.buyDate}</td>
                  <td className="text-right px-2 py-2 font-mono tabular-nums">{p.daysHeld}日</td>
                  <td className="text-right px-2 py-2 font-mono tabular-nums">{formatPrice(p.buyPrice)}</td>
                  <td className="px-2 py-2">
                    {p.isSellDue ? (
                      <Badge variant="destructive" className="text-[10px] animate-pulse">
                        売りタイミング
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] border-emerald-500/50 text-emerald-600 dark:text-emerald-400">
                        保有中
                      </Badge>
                    )}
                  </td>
                  <td className="text-right px-4 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground"
                        onClick={() => onCancel(p.id)}>
                        取消
                      </Button>
                      <SellDialog position={p} onSell={onSell} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
