'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  BarChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import type { DailyBar } from '@/lib/types/stock';
import { formatPrice, formatVolume } from '@/lib/utils/format';
import { sma, bollingerBands, rsi, macd } from '@/lib/utils/indicators';

interface StockChartProps {
  data: DailyBar[];
  symbol: string;
}

function formatDateLabel(dateStr: string) {
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
  rsi: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHist: number | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PriceTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as ChartDataPoint;
  if (!d) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono tabular-nums">
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
          <>
            <span className="text-blue-400">SMA20</span>
            <span className="text-right">{formatPrice(d.sma20)}</span>
          </>
        )}
        {d.sma50 !== null && (
          <>
            <span className="text-orange-400">SMA50</span>
            <span className="text-right">{formatPrice(d.sma50)}</span>
          </>
        )}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RsiTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as ChartDataPoint;
  if (!d || d.rsi === null) return null;
  return (
    <div className="rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md">
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-2 font-mono tabular-nums">RSI {d.rsi.toFixed(1)}</span>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MacdTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as ChartDataPoint;
  if (!d || d.macd === null) return null;
  return (
    <div className="rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md">
      <span className="text-muted-foreground">{label}</span>
      <div className="font-mono tabular-nums">
        <span className="text-blue-400">MACD {d.macd?.toFixed(2)}</span>
        {d.macdSignal !== null && (
          <span className="ml-2 text-orange-400">Sig {d.macdSignal.toFixed(2)}</span>
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
    const rsiValues = rsi(closes, 14);
    const macdResult = macd(closes, 12, 26, 9);

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
      bbRange: bb.upper[i] !== null && bb.lower[i] !== null
        ? [bb.lower[i], bb.upper[i]] as [number, number]
        : undefined,
      rsi: rsiValues[i],
      macd: macdResult.macd[i],
      macdSignal: macdResult.signal[i],
      macdHist: macdResult.histogram[i],
    }));
  }, [data]);

  const isUp = data[data.length - 1].close >= data[0].close;
  const lineColor = isUp ? '#10b981' : '#ef4444';
  const tickInterval = Math.max(1, Math.floor(data.length / 5));

  const maxVolume = Math.max(...data.map((b) => b.volume));

  return (
    <div className="space-y-0">
      {/* Price Chart with SMA, Bollinger Bands */}
      <div>
        <div className="flex items-center gap-3 mb-1 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-[2px] bg-blue-400 rounded" />SMA20
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-[2px] bg-orange-400 rounded" />SMA50
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-[2px] bg-purple-400/50 rounded" />BB
          </span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateLabel}
              interval={tickInterval}
              tick={{ fontSize: 10 }}
              stroke="var(--color-muted-foreground)"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              orientation="right"
              domain={['auto', 'auto']}
              tickFormatter={(v: number) => `$${v.toFixed(0)}`}
              tick={{ fontSize: 10, fontFamily: 'var(--font-mono)' }}
              stroke="var(--color-muted-foreground)"
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip content={<PriceTooltip />} />
            {/* Bollinger Bands as area */}
            <Area
              dataKey="bbUpper"
              stroke="none"
              fill="transparent"
              isAnimationActive={false}
            />
            <Area
              dataKey="bbLower"
              stroke="none"
              fill="transparent"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="bbUpper"
              stroke="#a855f7"
              strokeWidth={1}
              strokeOpacity={0.3}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="bbLower"
              stroke="#a855f7"
              strokeWidth={1}
              strokeOpacity={0.3}
              dot={false}
              isAnimationActive={false}
            />
            {/* SMA Lines */}
            <Line
              type="monotone"
              dataKey="sma20"
              stroke="#60a5fa"
              strokeWidth={1}
              dot={false}
              strokeDasharray="4 2"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="sma50"
              stroke="#fb923c"
              strokeWidth={1}
              dot={false}
              strokeDasharray="4 2"
              isAnimationActive={false}
            />
            {/* Price Line */}
            <Line
              type="monotone"
              dataKey="close"
              stroke={lineColor}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Volume Chart */}
      <ResponsiveContainer width="100%" height={40}>
        <BarChart data={chartData} margin={{ top: 0, right: 4, bottom: 0, left: 4 }}>
          <XAxis dataKey="date" hide />
          <YAxis hide domain={[0, maxVolume * 2]} />
          <Bar dataKey="volume" isAnimationActive={false}>
            {chartData.map((entry, i) => (
              <Cell
                key={entry.date}
                fill={
                  i > 0 && entry.close >= chartData[i - 1].close
                    ? '#10b98140'
                    : '#ef444440'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* RSI Chart */}
      <div>
        <span className="text-[10px] text-muted-foreground">RSI(14)</span>
        <ResponsiveContainer width="100%" height={60}>
          <LineChart data={chartData} margin={{ top: 2, right: 4, bottom: 0, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis
              orientation="right"
              domain={[0, 100]}
              ticks={[30, 50, 70]}
              tick={{ fontSize: 9, fontFamily: 'var(--font-mono)' }}
              stroke="var(--color-muted-foreground)"
              tickLine={false}
              axisLine={false}
              width={24}
            />
            <Tooltip content={<RsiTooltip />} />
            <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="2 2" strokeOpacity={0.5} />
            <ReferenceLine y={30} stroke="#10b981" strokeDasharray="2 2" strokeOpacity={0.5} />
            <Line
              type="monotone"
              dataKey="rsi"
              stroke="#a855f7"
              strokeWidth={1}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* MACD Chart */}
      <div>
        <span className="text-[10px] text-muted-foreground">MACD(12,26,9)</span>
        <ResponsiveContainer width="100%" height={60}>
          <ComposedChart data={chartData} margin={{ top: 2, right: 4, bottom: 0, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis
              orientation="right"
              tick={{ fontSize: 9, fontFamily: 'var(--font-mono)' }}
              stroke="var(--color-muted-foreground)"
              tickLine={false}
              axisLine={false}
              width={36}
              tickFormatter={(v: number) => v.toFixed(1)}
            />
            <Tooltip content={<MacdTooltip />} />
            <ReferenceLine y={0} stroke="var(--color-border)" />
            <Bar dataKey="macdHist" isAnimationActive={false}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.date}
                  fill={
                    entry.macdHist !== null && entry.macdHist >= 0
                      ? '#10b98180'
                      : '#ef444480'
                  }
                />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="macd"
              stroke="#60a5fa"
              strokeWidth={1}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="macdSignal"
              stroke="#fb923c"
              strokeWidth={1}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
