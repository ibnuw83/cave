
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export function ExitPin(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pin: string;
  onSuccess: () => void;
}) {
  const { open, onOpenChange, pin, onSuccess } = props;
  const { toast } = useToast();
  const [value, setValue] = useState('');

  const submit = () => {
    if (value === pin) {
      setValue('');
      onOpenChange(false);
      onSuccess();
      return;
    }
    toast({ variant: 'destructive', title: 'PIN salah', description: 'Coba lagi ya. Kiosnya jangan baper.' });
    setValue('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keluar dari Mode Kios</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            type="password"
            placeholder="Masukkan PIN"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button onClick={submit}>Keluar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

    