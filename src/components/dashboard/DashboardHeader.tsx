'use client';

import { Moon, Sun, TrendingUp } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApiUsage } from '@/lib/hooks/useApiUsage';
import { AddStockDialog } from './AddStockDialog';

interface DashboardHeaderProps {
  stockCount: number;
  onAddStock: (symbol: string) => void;
}

export function DashboardHeader({
  stockCount,
  onAddStock,
}: DashboardHeaderProps) {
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
          {stockCount} {stockCount === 1 ? 'stock' : 'stocks'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={remaining <= 5 ? 'destructive' : 'secondary'} className="font-mono tabular-nums text-xs">
          API {remaining}/25
        </Badge>
        <AddStockDialog onAdd={onAddStock} />
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
