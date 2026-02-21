'use client';

import { RotateCw, X } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStockData } from '@/lib/hooks/useStockData';
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

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <span className="font-mono font-semibold text-base">{symbol}</span>
        <div className="flex items-center gap-1">
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
