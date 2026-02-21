import type { DailyBar } from '@/lib/types/stock';

// Simple Moving Average
export function sma(data: number[], period: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    return slice.reduce((sum, v) => sum + v, 0) / period;
  });
}

// Exponential Moving Average
export function ema(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      const initial = data.slice(0, period).reduce((sum, v) => sum + v, 0) / period;
      result.push(initial);
    } else {
      const prev = result[i - 1] as number;
      result.push((data[i] - prev) * multiplier + prev);
    }
  }
  return result;
}

// RSI (Relative Strength Index)
export function rsi(closes: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      result.push(null);
      continue;
    }

    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);

    if (i < period) {
      result.push(null);
      continue;
    }

    if (i === period) {
      const avgGain = gains.slice(0, period).reduce((s, v) => s + v, 0) / period;
      const avgLoss = losses.slice(0, period).reduce((s, v) => s + v, 0) / period;
      if (avgLoss === 0) {
        result.push(100);
      } else {
        result.push(100 - 100 / (1 + avgGain / avgLoss));
      }
    } else {
      const prevRsi = result[i - 1] as number;
      const prevAvgGain = (100 / (100 - prevRsi) - 1) * ((() => {
        // Recalculate using smoothed method
        const g = gains.slice(0, period).reduce((s, v) => s + v, 0) / period;
        const l = losses.slice(0, period).reduce((s, v) => s + v, 0) / period;
        return l === 0 ? 0 : l;
      })());
      // Use simplified Wilder smoothing
      const recentGains = gains.slice(-period);
      const recentLosses = losses.slice(-period);
      const avgGain = recentGains.reduce((s, v) => s + v, 0) / period;
      const avgLoss = recentLosses.reduce((s, v) => s + v, 0) / period;
      if (avgLoss === 0) {
        result.push(100);
      } else {
        result.push(100 - 100 / (1 + avgGain / avgLoss));
      }
    }
  }

  return result;
}

// MACD
export interface MACDResult {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
}

export function macd(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9,
): MACDResult {
  const fastEma = ema(closes, fastPeriod);
  const slowEma = ema(closes, slowPeriod);

  const macdLine: (number | null)[] = fastEma.map((f, i) => {
    const s = slowEma[i];
    if (f === null || s === null) return null;
    return f - s;
  });

  const macdValues = macdLine.filter((v): v is number => v !== null);
  const signalEma = ema(macdValues, signalPeriod);

  const signal: (number | null)[] = [];
  const histogram: (number | null)[] = [];
  let signalIdx = 0;

  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] === null) {
      signal.push(null);
      histogram.push(null);
    } else {
      const sig = signalEma[signalIdx] ?? null;
      signal.push(sig);
      histogram.push(sig !== null ? (macdLine[i] as number) - sig : null);
      signalIdx++;
    }
  }

  return { macd: macdLine, signal, histogram };
}

// Bollinger Bands
export interface BollingerResult {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
}

export function bollingerBands(
  closes: number[],
  period: number = 20,
  stdDev: number = 2,
): BollingerResult {
  const middle = sma(closes, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < closes.length; i++) {
    const mid = middle[i];
    if (mid === null) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    const slice = closes.slice(i - period + 1, i + 1);
    const variance = slice.reduce((sum, v) => sum + (v - mid) ** 2, 0) / period;
    const sd = Math.sqrt(variance) * stdDev;
    upper.push(mid + sd);
    lower.push(mid - sd);
  }

  return { upper, middle, lower };
}

// Signal detection
export interface Signal {
  type: 'bullish' | 'bearish' | 'neutral';
  label: string;
  description: string;
}

export function detectSignals(bars: DailyBar[]): Signal[] {
  const closes = bars.map((b) => b.close);
  const signals: Signal[] = [];

  // RSI signals
  const rsiValues = rsi(closes);
  const latestRsi = rsiValues[rsiValues.length - 1];
  if (latestRsi !== null) {
    if (latestRsi >= 70) {
      signals.push({ type: 'bearish', label: `RSI ${latestRsi.toFixed(0)}`, description: '買われすぎ' });
    } else if (latestRsi <= 30) {
      signals.push({ type: 'bullish', label: `RSI ${latestRsi.toFixed(0)}`, description: '売られすぎ' });
    } else {
      signals.push({ type: 'neutral', label: `RSI ${latestRsi.toFixed(0)}`, description: '中立' });
    }
  }

  // SMA Cross signals
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const len = closes.length;
  if (sma20[len - 1] !== null && sma50[len - 1] !== null && sma20[len - 2] !== null && sma50[len - 2] !== null) {
    const prevAbove = (sma20[len - 2] as number) > (sma50[len - 2] as number);
    const currAbove = (sma20[len - 1] as number) > (sma50[len - 1] as number);
    if (!prevAbove && currAbove) {
      signals.push({ type: 'bullish', label: 'ゴールデンクロス', description: 'SMA20がSMA50を上抜け' });
    } else if (prevAbove && !currAbove) {
      signals.push({ type: 'bearish', label: 'デッドクロス', description: 'SMA20がSMA50を下抜け' });
    } else if (currAbove) {
      signals.push({ type: 'bullish', label: 'SMA20 > SMA50', description: '上昇トレンド' });
    } else {
      signals.push({ type: 'bearish', label: 'SMA20 < SMA50', description: '下降トレンド' });
    }
  }

  // MACD signals
  const macdResult = macd(closes);
  const macdLen = macdResult.histogram.length;
  const latestHist = macdResult.histogram[macdLen - 1];
  const prevHist = macdResult.histogram[macdLen - 2];
  if (latestHist !== null && prevHist !== null) {
    if (prevHist < 0 && latestHist >= 0) {
      signals.push({ type: 'bullish', label: 'MACDクロス↑', description: 'MACDがシグナル線を上抜け' });
    } else if (prevHist >= 0 && latestHist < 0) {
      signals.push({ type: 'bearish', label: 'MACDクロス↓', description: 'MACDがシグナル線を下抜け' });
    } else if (latestHist >= 0) {
      signals.push({ type: 'bullish', label: 'MACD+', description: 'ポジティブモメンタム' });
    } else {
      signals.push({ type: 'bearish', label: 'MACD-', description: 'ネガティブモメンタム' });
    }
  }

  // Bollinger Band signals
  const bb = bollingerBands(closes);
  const latestClose = closes[len - 1];
  const latestUpper = bb.upper[len - 1];
  const latestLower = bb.lower[len - 1];
  if (latestUpper !== null && latestLower !== null) {
    if (latestClose >= latestUpper) {
      signals.push({ type: 'bearish', label: 'BB上限タッチ', description: 'ボリンジャー上限で反落の可能性' });
    } else if (latestClose <= latestLower) {
      signals.push({ type: 'bullish', label: 'BB下限タッチ', description: 'ボリンジャー下限で反発の可能性' });
    }
  }

  // Volume signal
  const volumes = bars.map((b) => b.volume);
  const avgVolume = volumes.slice(-20).reduce((s, v) => s + v, 0) / 20;
  const latestVolume = volumes[volumes.length - 1];
  if (latestVolume > avgVolume * 1.5) {
    const priceUp = closes[len - 1] > closes[len - 2];
    signals.push({
      type: priceUp ? 'bullish' : 'bearish',
      label: '出来高急増',
      description: `平均の${(latestVolume / avgVolume).toFixed(1)}倍`,
    });
  }

  return signals;
}
