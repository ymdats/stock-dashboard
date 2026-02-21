'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useStockData } from '@/lib/hooks/useStockData';
import { detectSignals, analyzeStock } from '@/lib/utils/indicators';
import { STOCK_NAMES } from '@/config/defaults';
import { StockKPI } from './StockKPI';
import { StockChart } from './StockChart';
import { StockChartSkeleton } from './StockChartSkeleton';
import { StockAnalysisPanel } from './StockAnalysisPanel';

interface StockCardProps {
  symbol: string;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}秒前`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}

export function StockCard({ symbol }: StockCardProps) {
  const { data, isLoading, error, lastFetched } =
    useStockData(symbol);

  const signals = data ? detectSignals(data.bars) : [];
  const analysis = data ? analyzeStock(data.bars) : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between px-3 py-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="font-mono font-semibold text-sm">{symbol}</span>
          <span className="text-[11px] text-muted-foreground truncate">
            {STOCK_NAMES[symbol] ?? symbol}
          </span>
        </div>
        {lastFetched && (
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatTimeAgo(lastFetched)}
          </span>
        )}
      </CardHeader>
      <CardContent className="px-3 pb-2 pt-0 space-y-1">
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}

        {isLoading && !data && <StockChartSkeleton />}

        {data && (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <StockKPI quote={data.quote} />
              {signals.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {signals.map((signal) => (
                    <Tooltip key={signal.label}>
                      <TooltipTrigger asChild>
                        <Badge
                          variant={signal.type === 'neutral' ? 'secondary' : 'outline'}
                          className={`text-[9px] font-medium cursor-help py-0 px-1.5 ${
                            signal.type === 'bullish'
                              ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                              : signal.type === 'bearish'
                                ? 'border-red-500/50 text-red-600 dark:text-red-400'
                                : ''
                          }`}
                        >
                          {signal.type === 'bullish' ? '▲' : signal.type === 'bearish' ? '▼' : '●'}{' '}
                          {signal.label}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                        {signal.description}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              )}
            </div>

            <StockChart data={data.bars} symbol={symbol} />

            {analysis && (
              <StockAnalysisPanel analysis={analysis} price={data.quote.price} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
