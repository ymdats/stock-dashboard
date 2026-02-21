'use client';

import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InfoTipProps {
  label: string;
  description: string;
}

export function InfoTip({ label, description }: InfoTipProps) {
  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3 w-3 cursor-help opacity-50 hover:opacity-100 transition-opacity" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] text-sm leading-relaxed">
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </span>
  );
}
