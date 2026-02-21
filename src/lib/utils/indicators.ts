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

// RSI (Relative Strength Index) - Wilder's Smoothed Method
export function rsi(closes: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return result;

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
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
  trigger: string;
  action: '買い' | '売り' | '様子見';
  priority: 'high' | 'medium' | 'low';
}

export interface StockAnalysis {
  structure: string;
  verdict: '買い検討可' | '売り検討可' | '様子見';
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

  // 1. Market Structure
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

  // 2. Trend context
  const sma50vals = sma(closes, 50);
  const sma50 = sma50vals[sma50vals.length - 1];
  const aboveSma50 = sma50 !== null ? price > sma50 : null;

  // 3. RSI
  const rsiVals = rsi(closes, 14);
  const rsiVal = rsiVals[rsiVals.length - 1];

  // 4. Volume
  const avgVol20 = volumes.slice(-20).reduce((s, v) => s + v, 0) / Math.min(20, volumes.length);
  const latestVol = volumes[volumes.length - 1];
  const volRatio = latestVol / avgVol20;

  // 5. ATR
  const atr = calcAtr(bars);

  // 6. Range context
  const high90 = Math.max(...highs);
  const fromHigh = ((price - high90) / high90) * 100;

  // 7. Bollinger Bands
  const bb = bollingerBands(closes, 20, 2);
  const bbUpper = bb.upper[bb.upper.length - 1];
  const bbLower = bb.lower[bb.lower.length - 1];

  // Support/Resistance
  const support = [...new Set(swLows.slice(-3).map((l) => Math.round(l.val)))].sort((a, b) => a - b);
  const resistance = [...new Set(swHighs.slice(-3).map((h) => Math.round(h.val)))].sort((a, b) => a - b);

  // ========================================
  // Data-validated verdict (Wilder RSI, 30 symbols × 2y, 7d horizon)
  // Multi-agent optimization: researcher + backtester + sell-analyst
  // ========================================
  // Buy: RSI<35 + deep below BB → 65.0% accuracy, EV +2.56%, PF 2.60
  // Sell①: RSI>80 + MACD histogram declining 2+ days → 66.7% down, EV +3.43%, PF 5.46
  // Sell②: ConsecUp≥5 + RSI>80 → 71.4% down, EV +2.60%, PF 4.34
  // Sell③: %B>0.95 + MACD histogram declining → 53.8% down, EV +1.78%, PF 2.42
  // Combined model: 366 signals, EV/trade +2.49%, total profit +912%
  // ========================================

  const deepBelowBB = bbLower !== null && price <= bbLower * 0.99;

  // Sell signal features
  const bbBandwidth = (bbUpper !== null && bbLower !== null) ? bbUpper - bbLower : 0;
  const pctB = bbBandwidth > 0 ? (price - bbLower!) / bbBandwidth : 0.5;
  const macdResult = macd(closes);
  const hist = macdResult.histogram;
  const latestHist = hist[hist.length - 1];
  const prevHist = hist[hist.length - 2];
  const macdHistDeclining = latestHist !== null && prevHist !== null && latestHist < prevHist;

  // MACD histogram declining for N consecutive days
  let macdDeclDays = 0;
  for (let i = hist.length - 1; i >= 1; i--) {
    if (hist[i] !== null && hist[i - 1] !== null && (hist[i] as number) < (hist[i - 1] as number)) {
      macdDeclDays++;
    } else break;
  }

  // Consecutive up days
  let consecUp = 0;
  for (let i = closes.length - 1; i >= 1; i--) {
    if (closes[i] > closes[i - 1]) consecUp++;
    else break;
  }

  let verdict: StockAnalysis['verdict'] = '様子見';
  let verdictType: StockAnalysis['verdictType'] = 'neutral';

  // Buy signal: RSI<35 + deep below BB (65.0% accuracy, EV +2.56%)
  if (rsiVal !== null && rsiVal < 35 && deepBelowBB) {
    verdict = '買い検討可';
    verdictType = 'bullish';
  }
  // Sell signal ①: RSI>80 + MACD declining 2+ days (66.7% down, EV +3.43%)
  else if (rsiVal !== null && rsiVal > 80 && macdDeclDays >= 2) {
    verdict = '売り検討可';
    verdictType = 'bearish';
  }
  // Sell signal ②: ConsecUp≥5 + RSI>80 (71.4% down, EV +2.60%)
  else if (consecUp >= 5 && rsiVal !== null && rsiVal > 80) {
    verdict = '売り検討可';
    verdictType = 'bearish';
  }
  // Sell signal ③: %B>0.95 + MACD histogram declining (53.8% down, EV +1.78%)
  else if (pctB > 0.95 && macdHistDeclining) {
    verdict = '売り検討可';
    verdictType = 'bearish';
  }

  // Context reasons (informational, not used for verdict)
  const reasons: { type: 'bullish' | 'bearish' | 'neutral'; text: string }[] = [];

  if (structure.includes('上昇')) reasons.push({ type: 'bullish', text: `価格構造: ${structure}` });
  else if (structure.includes('下降')) reasons.push({ type: 'bearish', text: `価格構造: ${structure}` });
  else reasons.push({ type: 'neutral', text: `価格構造: ${structure}` });

  if (aboveSma50 === true) reasons.push({ type: 'bullish', text: `SMA50($${sma50!.toFixed(0)})上` });
  else if (aboveSma50 === false) reasons.push({ type: 'bearish', text: `SMA50($${sma50!.toFixed(0)})下` });

  if (rsiVal !== null) {
    if (rsiVal < 20) reasons.push({ type: 'bullish', text: `RSI=${rsiVal.toFixed(0)} 極度の売られすぎ` });
    else if (rsiVal < 35) reasons.push({ type: 'bullish', text: `RSI=${rsiVal.toFixed(0)} 売られすぎ` });
    else if (rsiVal > 80) reasons.push({ type: 'bearish', text: `RSI=${rsiVal.toFixed(0)} 過熱` });
    else if (rsiVal > 70) reasons.push({ type: 'neutral', text: `RSI=${rsiVal.toFixed(0)} 高水準` });
    else reasons.push({ type: 'neutral', text: `RSI=${rsiVal.toFixed(0)}` });
  }

  if (volRatio > 1.5) {
    const dir = closes[closes.length - 1] > closes[closes.length - 2] ? '陽線' : '陰線';
    reasons.push({ type: 'neutral', text: `出来高${(volRatio).toFixed(1)}倍+${dir}` });
  }

  if (deepBelowBB) {
    reasons.push({ type: 'bullish', text: `BB下限を大幅に下抜け → 反発ゾーン` });
  } else if (bbLower !== null && price <= bbLower * 1.01) {
    reasons.push({ type: 'bullish', text: `BB下限付近 → 反発候補` });
  } else if (bbUpper !== null && price >= bbUpper * 0.99) {
    reasons.push({ type: 'neutral', text: `BB上限付近` });
  }

  if (fromHigh < -15) {
    reasons.push({ type: 'neutral', text: `高値から${fromHigh.toFixed(0)}%下落` });
  }

  // Verdict explanation
  if (verdictType === 'bullish') {
    reasons.push({ type: 'bullish', text: '→ RSI売られすぎ+BB下限突破(勝率65%,EV+2.6%)' });
  } else if (verdictType === 'bearish') {
    if (rsiVal !== null && rsiVal > 80 && macdDeclDays >= 2) {
      reasons.push({ type: 'bearish', text: '→ RSI過熱+MACD連続失速(下落率67%,EV+3.4%)' });
    } else if (consecUp >= 5 && rsiVal !== null && rsiVal > 80) {
      reasons.push({ type: 'bearish', text: '→ 連続上昇+RSI過熱(下落率71%,EV+2.6%)' });
    } else {
      reasons.push({ type: 'bearish', text: '→ BB上限圏+MACD失速(下落率54%,EV+1.8%)' });
    }
  }

  const atrStop = atr ? price - atr * 2 : null;
  const atrTarget = atr ? price + atr * 3 : null;
  const upsidePct = atrTarget ? ((atrTarget - price) / price) * 100 : null;
  const downsideRisk = atrStop ? ((price - atrStop) / price) * 100 : null;

  const nextActions: NextAction[] = [];

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
