'use client';

import type { StockAnalysis } from '@/lib/utils/indicators';
import { formatPrice } from '@/lib/utils/format';

interface StockAnalysisPanelProps {
  analysis: StockAnalysis;
  price: number;
}

// Score-based color gradient aligned with verdict labels
// 強い買い(+40~) / 買い(+20~39) / やや買い(+5~19) / 中立 / やや売り / 売り / 強い売り
function getScoreStyle(score: number): { bg: string; text: string; border: string } {
  if (score >= 40) return { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-700' };
  if (score >= 20) return { bg: 'bg-emerald-500/50', text: 'text-emerald-950 dark:text-white', border: 'border-emerald-500/60' };
  if (score >= 5)  return { bg: 'bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/25' };
  if (score > -5)  return { bg: 'bg-muted/50', text: 'text-muted-foreground', border: 'border-border' };
  if (score > -20) return { bg: 'bg-red-500/15', text: 'text-red-700 dark:text-red-400', border: 'border-red-500/25' };
  if (score > -40) return { bg: 'bg-red-500/50', text: 'text-red-950 dark:text-white', border: 'border-red-500/60' };
  return { bg: 'bg-red-600', text: 'text-white', border: 'border-red-700' };
}

export function StockAnalysisPanel({ analysis }: StockAnalysisPanelProps) {
  const style = getScoreStyle(analysis.score);
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
