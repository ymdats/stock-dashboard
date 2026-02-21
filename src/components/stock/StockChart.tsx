'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { DailyBar } from '@/lib/types/stock';
import { formatPrice, formatVolume } from '@/lib/utils/format';
import { sma, bollingerBands } from '@/lib/utils/indicators';
import { InfoTip } from './InfoTip';

interface StockChartProps {
  data: DailyBar[];
  symbol: string;
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

interface ChartDataPoint {
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  sma20: number | null;
  sma50: number | null;
  bbUpper: number | null;
  bbLower: number | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PriceTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as ChartDataPoint;
  if (!d) return null;
  return (
    <div className="rounded-md border bg-popover px-2 py-1.5 text-[10px] text-popover-foreground shadow-md">
      <p className="mb-0.5 font-medium">{label}</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0 font-mono tabular-nums">
        <span className="text-muted-foreground">O</span>
        <span className="text-right">{formatPrice(d.open)}</span>
        <span className="text-muted-foreground">H</span>
        <span className="text-right">{formatPrice(d.high)}</span>
        <span className="text-muted-foreground">L</span>
        <span className="text-right">{formatPrice(d.low)}</span>
        <span className="text-muted-foreground">C</span>
        <span className="text-right">{formatPrice(d.close)}</span>
        <span className="text-muted-foreground">Vol</span>
        <span className="text-right">{formatVolume(d.volume)}</span>
        {d.sma20 !== null && (
          <><span className="text-blue-400">SMA20</span><span className="text-right">{formatPrice(d.sma20)}</span></>
        )}
        {d.sma50 !== null && (
          <><span className="text-orange-400">SMA50</span><span className="text-right">{formatPrice(d.sma50)}</span></>
        )}
      </div>
    </div>
  );
}

export function StockChart({ data }: StockChartProps) {
  if (!data.length) return null;

  const chartData = useMemo(() => {
    const closes = data.map((b) => b.close);
    const sma20 = sma(closes, 20);
    const sma50 = sma(closes, 50);
    const bb = bollingerBands(closes, 20, 2);

    return data.map((bar, i) => ({
      date: bar.date,
      close: bar.close,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      volume: bar.volume,
      sma20: sma20[i],
      sma50: sma50[i],
      bbUpper: bb.upper[i],
      bbLower: bb.lower[i],
    }));
  }, [data]);

  const isUp = data[data.length - 1].close >= data[0].close;
  const lineColor = isUp ? '#10b981' : '#ef4444';
  const tickInterval = Math.max(1, Math.floor(data.length / 6));

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-2 mb-0.5">
        <InfoTip
          label="価格"
          description="90日間の終値チャート。緑＝期間中上昇、赤＝下落。ホバーでOHLC（始値・高値・安値・終値）と出来高を確認できます。"
        />
        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
          <span className="inline-block w-2.5 h-[1.5px] bg-blue-400" />
          <InfoTip label="SMA20" description="20日移動平均線。短期トレンド。SMA50を上抜け＝上昇転換、下抜け＝下降転換。" />
        </span>
        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
          <span className="inline-block w-2.5 h-[1.5px] bg-orange-400" />
          <InfoTip label="SMA50" description="50日移動平均線。中期トレンド。この上なら上昇基調、下なら下降基調。" />
        </span>
        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
          <span className="inline-block w-2.5 h-[1.5px] bg-purple-400/50" />
          <InfoTip label="BB" description="ボリンジャーバンド。紫の帯の上限・下限付近は反転しやすいゾーン。" />
        </span>
      </div>

      {/* Price Chart */}
      <ResponsiveContainer width="100%" height={120}>
        <ComposedChart data={chartData} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="date" tickFormatter={fmtDate} interval={tickInterval} tick={{ fontSize: 9 }} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} />
          <YAxis orientation="right" domain={['auto', 'auto']} tickFormatter={(v: number) => `$${v.toFixed(0)}`} tick={{ fontSize: 9, fontFamily: 'var(--font-mono)' }} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} width={40} />
          <Tooltip content={<PriceTooltip />} />
          <Line type="monotone" dataKey="bbUpper" stroke="#a855f7" strokeWidth={0.8} strokeOpacity={0.3} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="bbLower" stroke="#a855f7" strokeWidth={0.8} strokeOpacity={0.3} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="sma20" stroke="#60a5fa" strokeWidth={0.8} dot={false} strokeDasharray="3 2" isAnimationActive={false} />
          <Line type="monotone" dataKey="sma50" stroke="#fb923c" strokeWidth={0.8} dot={false} strokeDasharray="3 2" isAnimationActive={false} />
          <Line type="monotone" dataKey="close" stroke={lineColor} strokeWidth={1.5} dot={false} activeDot={{ r: 2, strokeWidth: 0 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
