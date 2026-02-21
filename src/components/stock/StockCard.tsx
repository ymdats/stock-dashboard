'use client';

import { RotateCw, X } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStockData } from '@/lib/hooks/useStockData';
import { detectSignals } from '@/lib/utils/indicators';
import { STOCK_NAMES } from '@/config/defaults';
import { StockKPI } from './StockKPI';
import { StockChart } from './StockChart';
import { StockChartSkeleton } from './StockChartSkeleton';

interface StockCardProps {
  symbol: string;
  onRemove: (symbol: string) => void;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function StockCard({ symbol, onRemove }: StockCardProps) {
  const { data, isLoading, error, lastFetched, refresh } =
    useStockData(symbol);

  const signals = data ? detectSignals(data.bars) : [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="font-mono font-semibold text-base">{symbol}</span>
          <span className="text-xs text-muted-foreground truncate">
            {STOCK_NAMES[symbol] ?? symbol}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => refresh()}
            disabled={isLoading}
          >
            <RotateCw
              className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onRemove(symbol)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {isLoading && !data && <StockChartSkeleton />}

        {data && (
          <>
            <StockKPI quote={data.quote} />

            {/* Signal Badges */}
            {signals.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {signals.map((signal) => (
                  <Badge
                    key={signal.label}
                    variant={signal.type === 'neutral' ? 'secondary' : 'outline'}
                    className={`text-[10px] font-medium ${
                      signal.type === 'bullish'
                        ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                        : signal.type === 'bearish'
                          ? 'border-red-500/50 text-red-600 dark:text-red-400'
                          : ''
                    }`}
                    title={signal.description}
                  >
                    {signal.type === 'bullish' ? '▲ ' : signal.type === 'bearish' ? '▼ ' : ''}
                    {signal.label}
                  </Badge>
                ))}
              </div>
            )}

            <StockChart data={data.bars} symbol={symbol} />
          </>
        )}

        {lastFetched && (
          <p className="text-xs text-muted-foreground">
            Cached {formatTimeAgo(lastFetched)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
