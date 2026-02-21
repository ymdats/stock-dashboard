'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useStockData } from '@/lib/hooks/useStockData';
import { detectSignals, analyzeStock } from '@/lib/utils/indicators';
import { formatPrice, formatChange, formatPercent } from '@/lib/utils/format';
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

  const quote = data?.quote;
  const isPositive = quote ? quote.change >= 0 : true;
  const changeColor = isPositive ? 'text-emerald-500' : 'text-red-500';

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <CardContent className="px-3 py-2 flex-1 flex flex-col min-h-0 gap-1">
        {/* Row 1: Symbol + Price + Signals + Time */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <span className="font-mono font-semibold text-sm">{symbol}</span>
          {quote && (
            <>
              <span className="font-mono text-sm font-bold tabular-nums">
                {formatPrice(quote.price)}
              </span>
              <span className={`font-mono text-xs tabular-nums ${changeColor}`}>
                {formatChange(quote.change)} ({formatPercent(quote.changePercent)})
              </span>
            </>
          )}
          {signals.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {signals.map((signal) => (
                <Tooltip key={signal.label}>
                  <TooltipTrigger asChild>
                    <Badge
                      variant={signal.type === 'neutral' ? 'secondary' : 'outline'}
                      className={`text-[11px] font-medium cursor-help py-0 px-1.5 ${
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
                  <TooltipContent side="bottom" className="text-sm max-w-[240px]">
                    {signal.description}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          )}
          {lastFetched && (
            <span className="text-[11px] text-muted-foreground ml-auto shrink-0">
              {formatTimeAgo(lastFetched)}
            </span>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {isLoading && !data && <StockChartSkeleton />}

        {data && (
          <>
            <div className="flex-1 min-h-0">
              <StockChart data={data.bars} symbol={symbol} />
            </div>

            {analysis && (
              <div className="shrink-0">
                <StockAnalysisPanel analysis={analysis} price={data.quote.price} />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
