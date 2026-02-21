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
    <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-2.5 w-2.5 cursor-help opacity-50 hover:opacity-100 transition-opacity" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px] text-xs leading-relaxed">
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </span>
  );
}
