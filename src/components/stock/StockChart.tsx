'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  BarChart,
  Line,
  Bar,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RsiTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as ChartDataPoint;
  if (!d || d.rsi === null) return null;
  const rsiVal = d.rsi;
  const zone = rsiVal >= 70 ? '（買われすぎ）' : rsiVal <= 30 ? '（売られすぎ）' : '';
  return (
    <div className="rounded-md border bg-popover px-2 py-1 text-[10px] text-popover-foreground shadow-md">
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-2 font-mono tabular-nums">RSI {rsiVal.toFixed(1)} {zone}</span>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MacdTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as ChartDataPoint;
  if (!d || d.macd === null) return null;
  return (
    <div className="rounded-md border bg-popover px-2 py-1 text-[10px] text-popover-foreground shadow-md">
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
      rsi: rsiValues[i],
      macd: macdResult.macd[i],
      macdSignal: macdResult.signal[i],
      macdHist: macdResult.histogram[i],
    }));
  }, [data]);

  const isUp = data[data.length - 1].close >= data[0].close;
  const lineColor = isUp ? '#10b981' : '#ef4444';
  const tickInterval = Math.max(1, Math.floor(data.length / 6));
  const maxVolume = Math.max(...data.map((b) => b.volume));

  return (
    <div className="space-y-0">
      {/* Legend with InfoTips */}
      <div className="flex items-center gap-2 mb-0.5">
        <InfoTip
          label="価格"
          description="90日間の終値チャート。緑＝期間中上昇、赤＝下落。ホバーでOHLC（始値・高値・安値・終値）と出来高を確認できます。"
        />
        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
          <span className="inline-block w-2.5 h-[1.5px] bg-blue-400" />
          <InfoTip label="SMA20" description="20日単純移動平均線。直近20日の終値平均。短期トレンドを示します。SMA20がSMA50を上抜けると「ゴールデンクロス」（買いシグナル）。" />
        </span>
        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
          <span className="inline-block w-2.5 h-[1.5px] bg-orange-400" />
          <InfoTip label="SMA50" description="50日単純移動平均線。中期トレンドを示します。SMA20を下回ると「デッドクロス」（売りシグナル）。" />
        </span>
        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
          <span className="inline-block w-2.5 h-[1.5px] bg-purple-400/50" />
          <InfoTip label="BB" description="ボリンジャーバンド（20日,2σ）。価格の変動幅を示します。上限タッチ＝割高で反落の可能性、下限タッチ＝割安で反発の可能性。" />
        </span>
      </div>

      {/* Price Chart */}
      <ResponsiveContainer width="100%" height={100}>
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

      {/* Volume */}
      <div className="flex items-center gap-0.5">
        <InfoTip label="出来高" description="その日の売買された株数。出来高が多い日は相場の転換点になりやすい。緑＝前日比上昇、赤＝下落。平均の1.5倍以上は「出来高急増」シグナル。" />
      </div>
      <ResponsiveContainer width="100%" height={24}>
        <BarChart data={chartData} margin={{ top: 0, right: 2, bottom: 0, left: 2 }}>
          <XAxis dataKey="date" hide />
          <YAxis hide domain={[0, maxVolume * 2]} />
          <Bar dataKey="volume" isAnimationActive={false}>
            {chartData.map((entry, i) => (
              <Cell key={entry.date} fill={i > 0 && entry.close >= chartData[i - 1].close ? '#10b98140' : '#ef444440'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* RSI */}
      <div className="flex items-center gap-0.5">
        <InfoTip
          label="RSI(14)"
          description="相対力指数。0〜100の範囲で株の「買われすぎ・売られすぎ」を判断。70以上＝買われすぎ（売り検討）、30以下＝売られすぎ（買い検討）。赤点線が70、緑点線が30。"
        />
      </div>
      <ResponsiveContainer width="100%" height={36}>
        <LineChart data={chartData} margin={{ top: 1, right: 2, bottom: 0, left: 2 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="date" hide />
          <YAxis orientation="right" domain={[0, 100]} ticks={[30, 70]} tick={{ fontSize: 8, fontFamily: 'var(--font-mono)' }} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} width={20} />
          <Tooltip content={<RsiTooltip />} />
          <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="2 2" strokeOpacity={0.4} />
          <ReferenceLine y={30} stroke="#10b981" strokeDasharray="2 2" strokeOpacity={0.4} />
          <Line type="monotone" dataKey="rsi" stroke="#a855f7" strokeWidth={1} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>

      {/* MACD */}
      <div className="flex items-center gap-0.5">
        <InfoTip
          label="MACD(12,26,9)"
          description="移動平均収束拡散法。トレンドの勢いと方向を判断。青線(MACD)が橙線(シグナル)を上抜け＝買いシグナル、下抜け＝売りシグナル。緑バー＝上昇勢い、赤バー＝下落勢い。"
        />
      </div>
      <ResponsiveContainer width="100%" height={36}>
        <ComposedChart data={chartData} margin={{ top: 1, right: 2, bottom: 0, left: 2 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="date" hide />
          <YAxis orientation="right" tick={{ fontSize: 8, fontFamily: 'var(--font-mono)' }} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} width={28} tickFormatter={(v: number) => v.toFixed(0)} />
          <Tooltip content={<MacdTooltip />} />
          <ReferenceLine y={0} stroke="var(--color-border)" />
          <Bar dataKey="macdHist" isAnimationActive={false}>
            {chartData.map((entry) => (
              <Cell key={entry.date} fill={entry.macdHist !== null && entry.macdHist >= 0 ? '#10b98180' : '#ef444480'} />
            ))}
          </Bar>
          <Line type="monotone" dataKey="macd" stroke="#60a5fa" strokeWidth={0.8} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="macdSignal" stroke="#fb923c" strokeWidth={0.8} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
