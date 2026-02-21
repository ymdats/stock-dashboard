'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface AddStockDialogProps {
  onAdd: (symbol: string) => void;
}

export function AddStockDialog({ onAdd }: AddStockDialogProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  const isValid = /^[A-Z]{1,5}$/.test(value);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    onAdd(value);
    setValue('');
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[340px]">
        <DialogHeader>
          <DialogTitle>Add Stock</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="AAPL"
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            maxLength={5}
            className="font-mono uppercase"
          />
          <Button type="submit" disabled={!isValid}>
            Add
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
