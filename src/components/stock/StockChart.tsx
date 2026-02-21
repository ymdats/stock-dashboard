'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { DailyBar } from '@/lib/types/stock';
import { formatPrice, formatVolume } from '@/lib/utils/format';

interface StockChartProps {
  data: DailyBar[];
  symbol: string;
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: DailyBar }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const bar = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono tabular-nums">
        <span className="text-muted-foreground">Open</span>
        <span className="text-right">{formatPrice(bar.open)}</span>
        <span className="text-muted-foreground">High</span>
        <span className="text-right">{formatPrice(bar.high)}</span>
        <span className="text-muted-foreground">Low</span>
        <span className="text-right">{formatPrice(bar.low)}</span>
        <span className="text-muted-foreground">Close</span>
        <span className="text-right">{formatPrice(bar.close)}</span>
        <span className="text-muted-foreground">Volume</span>
        <span className="text-right">{formatVolume(bar.volume)}</span>
      </div>
    </div>
  );
}

export function StockChart({ data }: StockChartProps) {
  if (!data.length) return null;

  const isUp = data[data.length - 1].close >= data[0].close;
  const lineColor = isUp ? '#10b981' : '#ef4444';

  const tickInterval = Math.max(1, Math.floor(data.length / 5));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-border)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateLabel}
          interval={tickInterval}
          tick={{ fontSize: 11 }}
          stroke="var(--color-muted-foreground)"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          orientation="right"
          domain={['auto', 'auto']}
          tickFormatter={(v: number) => `$${v.toFixed(0)}`}
          tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
          stroke="var(--color-muted-foreground)"
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="close"
          stroke={lineColor}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
