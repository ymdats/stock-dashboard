'use client';

import { Moon, Sun, TrendingUp, RefreshCw } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApiUsage } from '@/lib/hooks/useApiUsage';

interface DashboardHeaderProps {
  stockCount: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function DashboardHeader({ stockCount, onRefresh, isRefreshing }: DashboardHeaderProps) {
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
        <Badge variant={remaining <= 5 ? 'destructive' : 'secondary'} className="font-mono tabular-nums text-xs">
          API残り {remaining}回
        </Badge>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? '更新中…' : 'データ更新'}
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
