'use client';

import type { StockAnalysis } from '@/lib/utils/indicators';
import { formatPrice } from '@/lib/utils/format';

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
    <div className="border-t pt-1.5 space-y-1">
      {/* Score badge + verdict + WR/EV */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${style.bg} ${style.text} ${style.border}`}>
            {analysis.verdict}
          </span>
          <span className={`text-[11px] font-mono tabular-nums ${
            analysis.score > 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : analysis.score < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-muted-foreground'
          }`}>
            勝率{analysis.winRate}% / {evPrefix}{analysis.expectedValue}%
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
          score {analysis.score > 0 ? '+' : ''}{analysis.score.toFixed(0)}
        </span>
      </div>

      {/* Reasons */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {analysis.reasons.map((r) => (
          <span
            key={r.text}
            className={`text-[11px] ${
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

      {/* Target / Stop / Support / Resistance */}
      {analysis.atrTarget && analysis.atrStop && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] font-mono tabular-nums">
          <div>
            <span className="text-muted-foreground">Target: </span>
            <span className="text-emerald-600 dark:text-emerald-400">
              {formatPrice(analysis.atrTarget)} (+{analysis.upsidePct?.toFixed(1)}%)
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Stop: </span>
            <span className="text-red-600 dark:text-red-400">
              {formatPrice(analysis.atrStop)} (-{analysis.downsideRisk?.toFixed(1)}%)
            </span>
          </div>
          {analysis.support.length > 0 && (
            <div>
              <span className="text-muted-foreground">Support: </span>
              <span>{analysis.support.map((s) => `$${s}`).join(', ')}</span>
            </div>
          )}
          {analysis.resistance.length > 0 && (
            <div>
              <span className="text-muted-foreground">Resist: </span>
              <span>{analysis.resistance.map((r) => `$${r}`).join(', ')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
