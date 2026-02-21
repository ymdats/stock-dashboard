'use client';

import type { StockAnalysis } from '@/lib/utils/indicators';
import { formatPrice } from '@/lib/utils/format';

interface StockAnalysisPanelProps {
  analysis: StockAnalysis;
  price: number;
}

export function StockAnalysisPanel({ analysis }: StockAnalysisPanelProps) {
  const verdictColor =
    analysis.verdictType === 'bullish'
      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      : analysis.verdictType === 'bearish'
        ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30'
        : 'text-muted-foreground bg-muted/50 border-border';

  return (
    <div className="border-t pt-1.5 space-y-1">
      {/* Verdict + Structure */}
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${verdictColor}`}>
          {analysis.verdict}
        </span>
        <span className="text-xs text-muted-foreground font-mono">
          構造: {analysis.structure}
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
