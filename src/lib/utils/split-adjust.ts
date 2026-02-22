import type { DailyBar } from '@/lib/types/stock';

/**
 * Detect stock splits in unadjusted daily data and normalize prices.
 * Handles forward splits (e.g., 10:1) and reverse splits (e.g., 1:10).
 */
export function adjustForSplits(bars: DailyBar[]): DailyBar[] {
  if (bars.length < 2) return bars;
  const result = bars.map((b) => ({ ...b }));

  for (let i = 1; i < result.length; i++) {
    const prevClose = result[i - 1].close;
    const currOpen = result[i].open;
    if (prevClose <= 0 || currOpen <= 0) continue;

    const ratio = currOpen / prevClose;

    // Forward split: open is ~1/N of previous close (e.g., 10:1 → ratio ≈ 0.1)
    if (ratio < 0.4) {
      const splitRatio = Math.round(1 / ratio);
      for (let j = 0; j < i; j++) {
        result[j].open /= splitRatio;
        result[j].high /= splitRatio;
        result[j].low /= splitRatio;
        result[j].close /= splitRatio;
        result[j].volume *= splitRatio;
      }
    }
    // Reverse split: open is ~N× previous close (e.g., 1:10 → ratio ≈ 10)
    else if (ratio > 2.5) {
      const mergeRatio = Math.round(ratio);
      for (let j = 0; j < i; j++) {
        result[j].open *= mergeRatio;
        result[j].high *= mergeRatio;
        result[j].low *= mergeRatio;
        result[j].close *= mergeRatio;
        result[j].volume = Math.round(result[j].volume / mergeRatio);
      }
    }
  }

  return result;
}
