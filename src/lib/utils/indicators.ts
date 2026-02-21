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

// ATR (Average True Range)
function calcAtr(bars: DailyBar[], period: number = 14): number | null {
  if (bars.length < period + 1) return null;
  const trs: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const tr = Math.max(
      bars[i].high - bars[i].low,
      Math.abs(bars[i].high - bars[i - 1].close),
      Math.abs(bars[i].low - bars[i - 1].close),
    );
    trs.push(tr);
  }
  return trs.slice(-period).reduce((s, v) => s + v, 0) / period;
}

// Swing point detection
function findSwingHighs(data: number[], window: number = 5): { idx: number; val: number }[] {
  const result: { idx: number; val: number }[] = [];
  for (let i = window; i < data.length - window; i++) {
    const slice = data.slice(i - window, i + window + 1);
    if (data[i] === Math.max(...slice)) {
      result.push({ idx: i, val: data[i] });
    }
  }
  return result;
}

function findSwingLows(data: number[], window: number = 5): { idx: number; val: number }[] {
  const result: { idx: number; val: number }[] = [];
  for (let i = window; i < data.length - window; i++) {
    const slice = data.slice(i - window, i + window + 1);
    if (data[i] === Math.min(...slice)) {
      result.push({ idx: i, val: data[i] });
    }
  }
  return result;
}

// Rules-based analysis
export interface NextAction {
  trigger: string;     // 条件（例: "$274を出来高増で上抜け"）
  action: '買い' | '売り' | '様子見';
  priority: 'high' | 'medium' | 'low';
}

export interface StockAnalysis {
  structure: string;
  verdict: '買い検討可' | '買い検討(条件付)' | '様子見' | '見送り推奨' | '見送り';
  verdictType: 'bullish' | 'bearish' | 'neutral';
  reasons: { type: 'bullish' | 'bearish' | 'neutral'; text: string }[];
  support: number[];
  resistance: number[];
  atrStop: number | null;
  atrTarget: number | null;
  upsidePct: number | null;
  downsideRisk: number | null;
  nextActions: NextAction[];
}

export function analyzeStock(bars: DailyBar[]): StockAnalysis {
  const closes = bars.map((b) => b.close);
  const highs = bars.map((b) => b.high);
  const lows = bars.map((b) => b.low);
  const volumes = bars.map((b) => b.volume);
  const price = closes[closes.length - 1];

  // 1. Market Structure (Price Action first)
  const swHighs = findSwingHighs(closes, 5);
  const swLows = findSwingLows(closes, 5);
  let structure = 'レンジ';
  if (swHighs.length >= 2 && swLows.length >= 2) {
    const hh = swHighs[swHighs.length - 1].val > swHighs[swHighs.length - 2].val;
    const hl = swLows[swLows.length - 1].val > swLows[swLows.length - 2].val;
    const lh = swHighs[swHighs.length - 1].val < swHighs[swHighs.length - 2].val;
    const ll = swLows[swLows.length - 1].val < swLows[swLows.length - 2].val;
    if (hh && hl) structure = '上昇 (HH+HL)';
    else if (lh && ll) structure = '下降 (LH+LL)';
    else if (lh && hl) structure = '収束';
    else if (hh && ll) structure = '拡散';
  }

  // 2. Trend filter (SMA50 + slope)
  const sma50vals = sma(closes, 50);
  const sma50 = sma50vals[sma50vals.length - 1];
  const sma50prev = closes.length >= 60 ? sma50vals[closes.length - 11] : null;
  const aboveSma50 = sma50 !== null ? price > sma50 : null;
  const sma50Rising = (sma50 !== null && sma50prev !== null) ? sma50 > sma50prev : null;

  // 3. Momentum (RSI only - 1 indicator per category)
  const rsiVals = rsi(closes, 14);
  const rsiVal = rsiVals[rsiVals.length - 1];

  // 4. Volume context
  const avgVol20 = volumes.slice(-20).reduce((s, v) => s + v, 0) / Math.min(20, volumes.length);
  const latestVol = volumes[volumes.length - 1];
  const volRatio = latestVol / avgVol20;

  // 5. ATR for targets
  const atr = calcAtr(bars);

  // 6. 90d range
  const high90 = Math.max(...highs);
  const low90 = Math.min(...lows);
  const fromHigh = ((price - high90) / high90) * 100;

  // 7. BB position
  const bb = bollingerBands(closes, 20, 2);
  const bbUpper = bb.upper[bb.upper.length - 1];
  const bbLower = bb.lower[bb.lower.length - 1];

  // Support/Resistance
  const support = [...new Set(swLows.slice(-3).map((l) => Math.round(l.val)))].sort((a, b) => a - b);
  const resistance = [...new Set(swHighs.slice(-3).map((h) => Math.round(h.val)))].sort((a, b) => a - b);

  // Assessment
  const reasons: { type: 'bullish' | 'bearish' | 'neutral'; text: string }[] = [];

  if (structure.includes('上昇')) reasons.push({ type: 'bullish', text: `価格構造: ${structure}` });
  else if (structure.includes('下降')) reasons.push({ type: 'bearish', text: `価格構造: ${structure}` });
  else reasons.push({ type: 'neutral', text: `価格構造: ${structure}` });

  if (aboveSma50 === true) reasons.push({ type: 'bullish', text: `SMA50($${sma50!.toFixed(0)})上 → 上昇トレンド` });
  else if (aboveSma50 === false) reasons.push({ type: 'bearish', text: `SMA50($${sma50!.toFixed(0)})下 → 下降トレンド` });

  if (rsiVal !== null) {
    if (rsiVal < 30) reasons.push({ type: 'bullish', text: `RSI=${rsiVal.toFixed(0)} 売られすぎ` });
    else if (rsiVal > 70) reasons.push({ type: 'bearish', text: `RSI=${rsiVal.toFixed(0)} 買われすぎ` });
  }

  if (volRatio > 1.5 && closes[closes.length - 1] > closes[closes.length - 2]) {
    reasons.push({ type: 'bullish', text: `出来高急増(${(volRatio * 100).toFixed(0)}%)+陽線` });
  } else if (volRatio > 1.5 && closes[closes.length - 1] < closes[closes.length - 2]) {
    reasons.push({ type: 'bearish', text: `出来高急増(${(volRatio * 100).toFixed(0)}%)+陰線` });
  }

  if (bbLower !== null && price <= bbLower * 1.01) {
    reasons.push({ type: 'bullish', text: `BB下限タッチ → 反発ゾーン` });
  } else if (bbUpper !== null && price >= bbUpper * 0.99) {
    reasons.push({ type: 'bearish', text: `BB上限タッチ → 反落リスク` });
  }

  if (fromHigh < -15) {
    reasons.push({ type: 'bullish', text: `高値から${fromHigh.toFixed(0)}% 大幅下落済み` });
  }

  const bullCount = reasons.filter((r) => r.type === 'bullish').length;
  const bearCount = reasons.filter((r) => r.type === 'bearish').length;

  let verdict: StockAnalysis['verdict'];
  let verdictType: StockAnalysis['verdictType'];
  if (bullCount >= 3 && bearCount <= 1) { verdict = '買い検討可'; verdictType = 'bullish'; }
  else if (bullCount >= 2 && bullCount > bearCount) { verdict = '買い検討(条件付)'; verdictType = 'bullish'; }
  else if (bearCount >= 3 && bullCount <= 1) { verdict = '見送り'; verdictType = 'bearish'; }
  else if (bearCount >= 2 && bearCount > bullCount) { verdict = '見送り推奨'; verdictType = 'bearish'; }
  else { verdict = '様子見'; verdictType = 'neutral'; }

  // Disqualifiers: downgrade bullish to neutral when conviction is weak
  if (verdictType === 'bullish') {
    if (fromHigh > -3) {
      // DQ1: Near 90d high = overextended
      verdictType = 'neutral';
      verdict = '様子見';
      reasons.push({ type: 'neutral', text: `高値圏(${fromHigh.toFixed(1)}%) → 見送り` });
    } else if (aboveSma50 === true && sma50Rising === false) {
      // DQ2: Above SMA50 but slope declining = trend weakening
      verdictType = 'neutral';
      verdict = '様子見';
      reasons.push({ type: 'neutral', text: 'SMA50下降中 → トレンド弱化' });
    } else if (bearCount >= 1 && bullCount < 3) {
      // DQ3: Mixed signals without strong bull conviction
      verdictType = 'neutral';
      verdict = '様子見';
      reasons.push({ type: 'neutral', text: '売り信号混在 → 確信不足' });
    }
  }

  const atrStop = atr ? price - atr * 2 : null;
  const atrTarget = atr ? price + atr * 3 : null;
  const upsidePct = atrTarget ? ((atrTarget - price) / price) * 100 : null;
  const downsideRisk = atrStop ? ((price - atrStop) / price) * 100 : null;

  // Next action conditions
  const nextActions: NextAction[] = [];

  // Resistance breakout trigger
  const nearestResistance = resistance.find((r) => r > price);
  if (nearestResistance) {
    nextActions.push({
      trigger: `$${nearestResistance}を出来高増で上抜け`,
      action: '買い',
      priority: structure.includes('上昇') ? 'high' : 'medium',
    });
  }

  // Support breakdown trigger
  const nearestSupport = [...support].reverse().find((s) => s < price);
  if (nearestSupport) {
    nextActions.push({
      trigger: `$${nearestSupport}を割り込み`,
      action: '売り',
      priority: structure.includes('下降') ? 'high' : 'medium',
    });
  }

  // SMA cross triggers
  const sma20vals = sma(closes, 20);
  const sma20val = sma20vals[sma20vals.length - 1];
  if (sma20val !== null && sma50 !== null) {
    if (sma20val < sma50) {
      nextActions.push({
        trigger: `SMA20がSMA50を上抜け(ゴールデンクロス)`,
        action: '買い',
        priority: 'high',
      });
    } else if (sma20val > sma50 && (sma20val - sma50) / sma50 < 0.02) {
      // SMA20 is barely above SMA50 - death cross risk
      nextActions.push({
        trigger: `SMA20がSMA50を下抜け(デッドクロス)`,
        action: '売り',
        priority: 'high',
      });
    }
  }

  // RSI extreme triggers
  if (rsiVal !== null) {
    if (rsiVal > 40 && rsiVal < 70) {
      nextActions.push({
        trigger: `RSIが70超え → 買われすぎ`,
        action: '売り',
        priority: 'medium',
      });
    }
    if (rsiVal > 30 && rsiVal < 60) {
      nextActions.push({
        trigger: `RSIが30割れ → 売られすぎ反発`,
        action: '買い',
        priority: 'medium',
      });
    }
  }

  // BB bounce/break triggers
  if (bbLower !== null && bbUpper !== null) {
    if (price > bbLower * 1.02) {
      nextActions.push({
        trigger: `BB下限($${bbLower.toFixed(0)})付近で反発`,
        action: '買い',
        priority: 'low',
      });
    }
    if (price < bbUpper * 0.98) {
      nextActions.push({
        trigger: `BB上限($${bbUpper.toFixed(0)})到達で利確検討`,
        action: '売り',
        priority: 'low',
      });
    }
  }

  // SMA50 reclaim (if below)
  if (aboveSma50 === false && sma50 !== null) {
    nextActions.push({
      trigger: `SMA50($${sma50.toFixed(0)})を回復`,
      action: '買い',
      priority: 'high',
    });
  }

  return { structure, verdict, verdictType, reasons, support, resistance, atrStop, atrTarget, upsidePct, downsideRisk, nextActions };
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
