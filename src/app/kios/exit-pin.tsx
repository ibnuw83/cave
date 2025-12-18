'use client';

import { useState, MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const CORRECT_PIN = '1234';

export default function ExitPin({ onClose }: { onClose: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleSubmit = () => {
    if (pin === CORRECT_PIN) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      router.push('/');
    } else {
      setError(true);
      setPin('');
      // Tambahkan getaran untuk umpan balik error jika memungkinkan
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    }
  };

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="bg-card border border-border p-8 rounded-lg shadow-2xl w-full max-w-xs text-center" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-2">Keluar dari Mode Kios?</h2>
        <p className="text-muted-foreground mb-6">Masukkan PIN untuk melanjutkan</p>
        
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
           <Input
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              placeholder="••••"
              className="text-center text-2xl tracking-[.5em] mb-4"
              maxLength={4}
              autoFocus
            />
            
            {error && <p className="text-destructive text-sm mb-4">PIN Salah. Coba lagi.</p>}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
              <Button type="submit">Keluar</Button>
            </div>
        </form>
      </div>
    </div>
  );
}
