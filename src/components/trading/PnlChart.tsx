'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { Trade } from '@/lib/types/trade';

interface PnlChartProps {
  trades: Trade[];
}

export function PnlChart({ trades }: PnlChartProps) {
  const completed = trades
    .filter((t) => t.sellDate && t.pnlJpy !== undefined)
    .sort((a, b) => a.sellDate!.localeCompare(b.sellDate!));

  if (completed.length === 0) {
    return null;
  }

  let cumulative = 0;
  const data = completed.map((t) => {
    cumulative += t.pnlJpy!;
    return {
      date: t.sellDate!.slice(5),
      cumulative,
      symbol: t.symbol,
      pnl: t.pnlJpy!,
    };
  });

  const isPositive = cumulative >= 0;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="px-4 py-2 border-b flex items-center justify-between">
          <h3 className="text-sm font-semibold">累計損益</h3>
          <span className={`text-sm font-bold font-mono tabular-nums ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}¥{cumulative.toLocaleString()}
          </span>
        </div>
        <div className="h-48 px-2 py-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" opacity={0.5} />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                }}
                formatter={(value: number | undefined) => [`¥${(value ?? 0).toLocaleString()}`, '累計']}
                labelFormatter={(label) => label}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke={isPositive ? '#10b981' : '#ef4444'}
                fill={isPositive ? '#10b98120' : '#ef444420'}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
