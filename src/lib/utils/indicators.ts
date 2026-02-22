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

// ADX (Average Directional Index) - simplified, returns latest value
function calcAdx(bars: DailyBar[], period: number = 14): number | null {
  if (bars.length < period * 2 + 1) return null;

  const plusDm: number[] = [];
  const minusDm: number[] = [];
  const trList: number[] = [];

  for (let i = 1; i < bars.length; i++) {
    const up = bars[i].high - bars[i - 1].high;
    const down = bars[i - 1].low - bars[i].low;
    plusDm.push(up > down && up > 0 ? up : 0);
    minusDm.push(down > up && down > 0 ? down : 0);
    trList.push(Math.max(
      bars[i].high - bars[i].low,
      Math.abs(bars[i].high - bars[i - 1].close),
      Math.abs(bars[i].low - bars[i - 1].close),
    ));
  }

  let atrS = trList.slice(0, period).reduce((s, v) => s + v, 0) / period;
  let pdmS = plusDm.slice(0, period).reduce((s, v) => s + v, 0) / period;
  let mdmS = minusDm.slice(0, period).reduce((s, v) => s + v, 0) / period;

  const dxList: number[] = [];
  for (let i = period; i < trList.length; i++) {
    atrS = (atrS * (period - 1) + trList[i]) / period;
    pdmS = (pdmS * (period - 1) + plusDm[i]) / period;
    mdmS = (mdmS * (period - 1) + minusDm[i]) / period;

    if (atrS > 0) {
      const pdi = (pdmS / atrS) * 100;
      const mdi = (mdmS / atrS) * 100;
      if (pdi + mdi > 0) {
        dxList.push(Math.abs(pdi - mdi) / (pdi + mdi) * 100);
      }
    }
  }

  if (dxList.length < period) return null;
  let adxVal = dxList.slice(0, period).reduce((s, v) => s + v, 0) / period;
  for (let k = period; k < dxList.length; k++) {
    adxVal = (adxVal * (period - 1) + dxList[k]) / period;
  }
  return adxVal;
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

// Continuous score: -100 (strong sell) to +100 (strong buy)
// Backtested anchor points (30 symbols × 2yr, 7d forward)
// Piecewise linear interpolation gives continuous WR/EV for any score
//   [score, winRate%, expectedValue%]
const SCORE_ANCHORS: [number, number, number][] = [
  [-100, 48, -0.1],
  [ -40, 51,  0.4],
  [   0, 53,  0.6],
  [  25, 56,  1.1],
  [  40, 67,  2.6],
  [ 100, 67,  2.6],
];

function lerpAnchors(score: number, idx: 1 | 2): number {
  if (score <= SCORE_ANCHORS[0][0]) return SCORE_ANCHORS[0][idx];
  for (let i = 0; i < SCORE_ANCHORS.length - 1; i++) {
    if (score <= SCORE_ANCHORS[i + 1][0]) {
      const t = (score - SCORE_ANCHORS[i][0]) / (SCORE_ANCHORS[i + 1][0] - SCORE_ANCHORS[i][0]);
      return SCORE_ANCHORS[i][idx] + t * (SCORE_ANCHORS[i + 1][idx] - SCORE_ANCHORS[i][idx]);
    }
  }
  return SCORE_ANCHORS[SCORE_ANCHORS.length - 1][idx];
}

function getScoreStats(score: number): { winRate: number; ev: number } {
  return {
    winRate: Math.round(lerpAnchors(score, 1)),
    ev: Math.round(lerpAnchors(score, 2) * 10) / 10,
  };
}

export interface StockAnalysis {
  structure: string;
  score: number; // -100 (sell) ~ +100 (buy)
  verdict: string;
  verdictType: 'bullish' | 'bearish' | 'neutral';
  winRate: number;
  expectedValue: number;
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
  // Continuous scoring: -100 (sell) ~ +100 (buy)
  // Backtested on 30 symbols × 2yr, 7d forward returns
  // Score = weighted(RSI 35% + BB 25% + MACD 20% + vol/ADX 20%)
  // ========================================

  const adxVal = calcAdx(bars);
  const macdResult = macd(closes);
  const hist = macdResult.histogram;

  // MACD histogram declining days
  let macdDeclDays = 0;
  for (let i = hist.length - 1; i >= 1; i--) {
    if (hist[i] !== null && hist[i - 1] !== null && (hist[i] as number) < (hist[i - 1] as number)) {
      macdDeclDays++;
    } else break;
  }
  // MACD histogram rising days
  let macdRiseDays = 0;
  for (let i = hist.length - 1; i >= 1; i--) {
    if (hist[i] !== null && hist[i - 1] !== null && (hist[i] as number) > (hist[i - 1] as number)) {
      macdRiseDays++;
    } else break;
  }

  // --- Score calculation ---
  let score = 0;

  // 1. RSI component (35%): RSI 50 = neutral, <30 = buy, >70 = sell
  if (rsiVal !== null) {
    score += (50 - rsiVal) * 2 * 0.35;
  }

  // 2. BB position (25%): below mid = buy, above = sell
  const bbMid = bb.middle[bb.middle.length - 1];
  if (bbLower !== null && bbUpper !== null && bbMid !== null) {
    const bbWidth = bbUpper - bbLower;
    if (bbWidth > 0) {
      const bbPos = (price - bbMid) / (bbWidth / 2); // ~-1 to +1
      score += -bbPos * 50 * 0.25;
    }
  }

  // 3. MACD momentum (20%): declining = sell, rising = buy
  if (macdDeclDays > 0) {
    score += -Math.min(macdDeclDays * 15, 50) * 0.20;
  } else if (macdRiseDays > 0) {
    score += Math.min(macdRiseDays * 15, 50) * 0.20;
  }

  // 4. Volume + ADX (20%): confirms direction
  if (rsiVal !== null) {
    if (volRatio < 0.8 && rsiVal > 70) score -= 10 * 0.20; // exhaustion sell
    if (volRatio > 1.2 && rsiVal < 35) score += 15 * 0.20; // capitulation buy
  }
  if (adxVal !== null && adxVal > 25) {
    score *= 1 + (adxVal - 25) / 100; // amplify in strong trend
  }

  // Clamp
  score = Math.max(-100, Math.min(100, score));

  // Derive verdict from score
  const band = getScoreStats(score);
  let verdict: string;
  let verdictType: StockAnalysis['verdictType'];
  if (score >= 40) { verdict = '強い買い'; verdictType = 'bullish'; }
  else if (score >= 20) { verdict = '買い'; verdictType = 'bullish'; }
  else if (score >= 5) { verdict = 'やや買い'; verdictType = 'bullish'; }
  else if (score > -5) { verdict = '中立'; verdictType = 'neutral'; }
  else if (score > -20) { verdict = 'やや売り'; verdictType = 'bearish'; }
  else if (score > -40) { verdict = '売り'; verdictType = 'bearish'; }
  else { verdict = '強い売り'; verdictType = 'bearish'; }

  const winRate = band.winRate;
  const expectedValue = band.ev;

  // Context reasons
  const reasons: { type: 'bullish' | 'bearish' | 'neutral'; text: string }[] = [];

  if (structure.includes('上昇')) reasons.push({ type: 'bullish', text: `構造: ${structure}` });
  else if (structure.includes('下降')) reasons.push({ type: 'bearish', text: `構造: ${structure}` });
  else reasons.push({ type: 'neutral', text: `構造: ${structure}` });

  if (aboveSma50 === true) reasons.push({ type: 'bullish', text: `SMA50($${sma50!.toFixed(0)})上` });
  else if (aboveSma50 === false) reasons.push({ type: 'bearish', text: `SMA50($${sma50!.toFixed(0)})下` });

  if (rsiVal !== null) {
    const rsiType = rsiVal < 35 ? 'bullish' : rsiVal > 70 ? 'bearish' : 'neutral';
    const rsiLabel = rsiVal < 20 ? '極度の売られすぎ' : rsiVal < 35 ? '売られすぎ' : rsiVal > 80 ? '過熱' : rsiVal > 70 ? '高水準' : '';
    reasons.push({ type: rsiType, text: `RSI=${rsiVal.toFixed(0)}${rsiLabel ? ' ' + rsiLabel : ''}` });
  }

  if (volRatio > 1.5) {
    const dir = closes[closes.length - 1] > closes[closes.length - 2] ? '陽線' : '陰線';
    reasons.push({ type: 'neutral', text: `出来高${volRatio.toFixed(1)}倍+${dir}` });
  }

  if (bbLower !== null && price <= bbLower * 1.01) {
    reasons.push({ type: 'bullish', text: 'BB下限付近' });
  } else if (bbUpper !== null && price >= bbUpper * 0.99) {
    reasons.push({ type: 'bearish', text: 'BB上限付近' });
  }

  if (macdDeclDays >= 2) reasons.push({ type: 'bearish', text: `MACD ${macdDeclDays}日連続↓` });
  else if (macdRiseDays >= 2) reasons.push({ type: 'bullish', text: `MACD ${macdRiseDays}日連続↑` });

  if (adxVal !== null && adxVal > 25) reasons.push({ type: 'neutral', text: `ADX=${adxVal.toFixed(0)} トレンド強` });

  if (fromHigh < -15) reasons.push({ type: 'neutral', text: `高値から${fromHigh.toFixed(0)}%` });

  const atrStop = atr ? price - atr * 2 : null;
  const atrTarget = atr ? price + atr * 3 : null;
  const upsidePct = atrTarget ? ((atrTarget - price) / price) * 100 : null;
  const downsideRisk = atrStop ? ((price - atrStop) / price) * 100 : null;

  const nextActions: NextAction[] = [];

  return { structure, score, verdict, verdictType, winRate, expectedValue, reasons, support, resistance, atrStop, atrTarget, upsidePct, downsideRisk, nextActions };
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
