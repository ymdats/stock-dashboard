'use client';

import type { StockAnalysis } from '@/lib/utils/indicators';
import { formatPrice } from '@/lib/utils/format';

interface StockAnalysisPanelProps {
  analysis: StockAnalysis;
  price: number;
}

export function StockAnalysisPanel({ analysis, price }: StockAnalysisPanelProps) {
  const verdictColor =
    analysis.verdictType === 'bullish'
      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      : analysis.verdictType === 'bearish'
        ? 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30'
        : 'text-muted-foreground bg-muted/50 border-border';

  return (
    <div className="border-t pt-2 space-y-1.5">
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

      {/* Next Actions */}
      {analysis.nextActions.length > 0 && (
        <div className="border-t border-dashed pt-1.5">
          <p className="text-[11px] text-muted-foreground font-semibold mb-1">次のアクション条件</p>
          <div className="space-y-0.5">
            {analysis.nextActions
              .sort((a, b) => {
                const order = { high: 0, medium: 1, low: 2 };
                return order[a.priority] - order[b.priority];
              })
              .slice(0, 4)
              .map((na) => (
                <div key={na.trigger} className="flex items-start gap-1.5 text-[11px]">
                  <span
                    className={`shrink-0 ${
                      na.action === '買い'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : na.action === '売り'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {na.action === '買い' ? '▲' : na.action === '売り' ? '▼' : '●'}
                  </span>
                  <span className="text-muted-foreground">
                    {na.trigger}
                    {na.priority === 'high' && (
                      <span className="ml-0.5 text-amber-500 dark:text-amber-400">★</span>
                    )}
                  </span>
                  <span
                    className={`ml-auto shrink-0 font-medium ${
                      na.action === '買い'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : na.action === '売り'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-muted-foreground'
                    }`}
                  >
                    → {na.action}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
