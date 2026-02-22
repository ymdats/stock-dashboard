'use client';

import type { StockAnalysis } from '@/lib/utils/indicators';

interface StockAnalysisPanelProps {
  analysis: StockAnalysis;
  price: number;
}

// Score-based color: 買い(score>5+vol>1.2) / 強気(score>5) / やや強気(>0) / 中立(>-5) / 弱気(≤-5)
function getScoreStyle(score: number, isBuySignal: boolean): { bg: string; text: string; border: string } {
  if (isBuySignal) return { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-700' };
  if (score > 5)   return { bg: 'bg-emerald-700/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/50' };
  if (score > 0)   return { bg: 'bg-transparent', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-600/30 dark:border-emerald-500/30' };
  if (score > -5)  return { bg: 'bg-muted/50', text: 'text-muted-foreground', border: 'border-border' };
  return { bg: 'bg-transparent', text: 'text-red-600 dark:text-red-400', border: 'border-red-600/30 dark:border-red-500/30' };
}

export function StockAnalysisPanel({ analysis }: StockAnalysisPanelProps) {
  const style = getScoreStyle(analysis.score, analysis.isBuySignal);
  const evPrefix = analysis.expectedValue >= 0 ? '+' : '';

  return (
    <div className="border-t pt-1 space-y-0.5">
      {/* Score badge + verdict + WR/EV */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${style.bg} ${style.text} ${style.border}`}>
            {analysis.verdict}
          </span>
          <span className={`text-[10px] font-mono tabular-nums ${
            analysis.score > 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : analysis.score < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-muted-foreground'
          }`}>
            WR{analysis.winRate}% / {evPrefix}{analysis.expectedValue}%
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
          {analysis.score > 0 ? '+' : ''}{analysis.score.toFixed(0)}
        </span>
      </div>

      {/* Reasons */}
      <div className="flex flex-wrap gap-x-2 gap-y-0">
        {analysis.reasons.map((r) => (
          <span
            key={r.text}
            className={`text-[10px] ${
              r.type === 'bullish'
                ? 'text-emerald-600 dark:text-emerald-400'
                : r.type === 'bearish'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-muted-foreground'
            }`}
          >
            {r.type === 'bullish' ? '▲' : r.type === 'bearish' ? '▼' : '●'} {r.text}
          </span>
        ))}
      </div>
    </div>
  );
}
