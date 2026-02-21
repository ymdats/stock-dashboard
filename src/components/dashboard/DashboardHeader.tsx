'use client';

import { Moon, Sun, TrendingUp, RefreshCw } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApiUsage } from '@/lib/hooks/useApiUsage';
import type { RefreshProgress } from '@/lib/hooks/useRefreshAll';

interface DashboardHeaderProps {
  stockCount: number;
  onRefresh?: () => void;
  progress: RefreshProgress;
}

function formatRemaining(seconds: number): string {
  if (seconds < 60) return `約${seconds}秒`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `約${m}分${s}秒` : `約${m}分`;
}

export function DashboardHeader({ stockCount, onRefresh, progress }: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme();
  const { remaining } = useApiUsage();

  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold tracking-tight">
          Stock Dashboard
        </h1>
        <span className="text-sm text-muted-foreground">
          {stockCount} stocks
        </span>
      </div>
      <div className="flex items-center gap-2">
        {progress.isRefreshing && (
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            {progress.currentSymbol} 取得中 ({progress.current + 1}/{progress.total})
            {' '}残り{formatRemaining(progress.remainingSeconds)}
          </span>
        )}
        <Badge variant={remaining <= 5 ? 'destructive' : 'secondary'} className="font-mono tabular-nums text-xs">
          API残り {remaining}回
        </Badge>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={onRefresh}
          disabled={progress.isRefreshing}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${progress.isRefreshing ? 'animate-spin' : ''}`} />
          {progress.isRefreshing ? '更新中…' : 'データ更新'}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </header>
  );
}
