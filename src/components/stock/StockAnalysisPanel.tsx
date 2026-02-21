'use client';

import type { StockAnalysis } from '@/lib/utils/indicators';
import { formatPrice } from '@/lib/utils/format';

interface StockAnalysisPanelProps {
  analysis: StockAnalysis;
  price: number;
}

export function StockAnalysisPanel({ analysis }: StockAnalysisPanelProps) {
  const isBuy = analysis.verdictType === 'bullish';
  const isSell = analysis.verdictType === 'bearish';

  const bgColor = isBuy
    ? 'bg-emerald-500/10 border-emerald-500/30'
    : isSell
      ? 'bg-red-500/10 border-red-500/30'
      : 'bg-muted/50 border-border';

  const verdictLabel = isBuy ? '買い' : isSell ? '見送り' : '様子見';
  const verdictTextColor = isBuy
    ? 'text-emerald-600 dark:text-emerald-400'
    : isSell
      ? 'text-red-600 dark:text-red-400'
      : 'text-muted-foreground';

  // Summarize top reasons into one line
  const bullReasons = analysis.reasons.filter((r) => r.type === 'bullish').map((r) => r.text);
  const bearReasons = analysis.reasons.filter((r) => r.type === 'bearish').map((r) => r.text);
  const summary = isBuy
    ? bullReasons.slice(0, 2).join('、')
    : isSell
      ? bearReasons.slice(0, 2).join('、')
      : [...bullReasons.slice(0, 1), ...bearReasons.slice(0, 1)].join(' / ');

  return (
    <div className={`rounded border px-3 py-1.5 ${bgColor}`}>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-bold ${verdictTextColor}`}>
          {verdictLabel}
        </span>
        <span className="text-[11px] text-muted-foreground truncate">
          {summary}
        </span>
      </div>
      {isBuy && analysis.atrTarget && analysis.atrStop && (
        <div className="flex gap-3 mt-0.5 text-[11px] font-mono tabular-nums">
          <span>
            <span className="text-muted-foreground">Target </span>
            <span className="text-emerald-600 dark:text-emerald-400">
              {formatPrice(analysis.atrTarget)} (+{analysis.upsidePct?.toFixed(1)}%)
            </span>
          </span>
          <span>
            <span className="text-muted-foreground">Stop </span>
            <span className="text-red-600 dark:text-red-400">
              {formatPrice(analysis.atrStop)} (-{analysis.downsideRisk?.toFixed(1)}%)
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
