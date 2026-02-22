'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
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
import type { ActivePosition } from '@/lib/types/trade';
import { TRADE_AMOUNT_JPY } from '@/lib/types/trade';

interface StockCardProps {
  symbol: string;
  activeTrade?: ActivePosition;
  onBuy?: (symbol: string, price: number, score: number) => Promise<void>;
  onSell?: (tradeId: string, sellPrice: number) => Promise<void>;
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

function BuyDialog({ symbol, price, score, onBuy }: {
  symbol: string; price: number; score: number;
  onBuy: (symbol: string, price: number, score: number) => Promise<void>;
}) {
  const [editPrice, setEditPrice] = useState(price.toFixed(2));
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setEditPrice(price.toFixed(2)); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-6 text-[11px] px-2">
          買い記録
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{symbol} 購入記録</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="text-muted-foreground">
            ¥{TRADE_AMOUNT_JPY.toLocaleString()}分を購入記録します
          </div>
          <div>
            <label className="text-xs text-muted-foreground">約定価格 (USD)</label>
            <Input
              type="number" step="0.01" value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              className="font-mono tabular-nums"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            スコア: {score > 0 ? '+' : ''}{score.toFixed(0)}
          </div>
          <Button className="w-full" disabled={saving || !parseFloat(editPrice)}
            onClick={async () => {
              setSaving(true);
              await onBuy(symbol, parseFloat(editPrice), score);
              setSaving(false);
              setOpen(false);
            }}>
            {saving ? '保存中...' : '購入を記録'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CardSellDialog({ position, currentPrice, onSell }: {
  position: ActivePosition; currentPrice: number;
  onSell: (tradeId: string, sellPrice: number) => Promise<void>;
}) {
  const [price, setPrice] = useState(currentPrice.toFixed(2));
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const sellPrice = parseFloat(price) || 0;
  const pnlPct = sellPrice > 0 ? ((sellPrice - position.buyPrice) / position.buyPrice) * 100 : 0;
  const pnlJpy = Math.round((pnlPct / 100) * position.amountJpy);
  const sign = pnlJpy >= 0 ? '+' : '';

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setPrice(currentPrice.toFixed(2)); }}>
      <DialogTrigger asChild>
        <Button variant={position.isSellDue ? 'destructive' : 'outline'} size="sm"
          className={`h-6 text-[11px] px-2 ${position.isSellDue ? 'animate-pulse' : ''}`}>
          売り記録
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{position.symbol} 売却確認</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>保有: {position.daysHeld}日</span>
            <span>買値: {formatPrice(position.buyPrice)}</span>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">売値 (USD)</label>
            <Input type="number" step="0.01" value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="font-mono tabular-nums" />
          </div>
          <div className={`text-center text-lg font-bold font-mono tabular-nums ${pnlJpy >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {sign}¥{pnlJpy.toLocaleString()} ({sign}{pnlPct.toFixed(1)}%)
          </div>
          <Button className="w-full" disabled={sellPrice <= 0 || saving}
            onClick={async () => {
              setSaving(true);
              await onSell(position.id, sellPrice);
              setSaving(false);
              setOpen(false);
            }}>
            {saving ? '保存中...' : '売却を記録'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function StockCard({ symbol, activeTrade, onBuy, onSell }: StockCardProps) {
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

            {/* Trade actions row */}
            <div className="flex items-center gap-2 shrink-0 pt-1 border-t">
              {activeTrade ? (
                <>
                  {activeTrade.isSellDue ? (
                    <Badge variant="destructive" className="text-[10px] animate-pulse">
                      売りタイミング ({activeTrade.daysHeld}日)
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] border-emerald-500/50 text-emerald-600 dark:text-emerald-400">
                      保有中 {activeTrade.daysHeld}日
                    </Badge>
                  )}
                  {onSell && (
                    <div className="ml-auto">
                      <CardSellDialog position={activeTrade} currentPrice={data.quote.price} onSell={onSell} />
                    </div>
                  )}
                </>
              ) : (
                onBuy && analysis && (
                  <div className="flex items-center gap-2 ml-auto">
                    {analysis.isBuySignal && (
                      <Badge className="text-[10px] bg-emerald-600 text-white border-emerald-700 animate-pulse">
                        買いシグナル
                      </Badge>
                    )}
                    <BuyDialog symbol={symbol} price={data.quote.price} score={analysis.score} onBuy={onBuy} />
                  </div>
                )
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
