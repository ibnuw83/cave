'use client';

import { useState, MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CORRECT_PIN = '1234';

export default function ExitPin({ onClose }: { onClose: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();

  const handlePinInput = (num: string) => {
    if (pin.length < 4) {
      setPin(pin + num);
      setError(false);
    }
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  const handleConfirm = () => {
    if (pin === CORRECT_PIN) {
      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      router.push('/'); // Navigate to home
    } else {
      setError(true);
      setPin('');
    }
  };

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  const pinDots = Array(4).fill(0).map((_, i) => (
      <div key={i} className={`w-4 h-4 rounded-full border-2 ${pin.length > i ? 'bg-white' : 'bg-transparent'}`} />
  ));

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="bg-background border border-border p-8 rounded-lg shadow-2xl w-full max-w-xs text-center" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-2">Keluar dari Mode Kios?</h2>
        <p className="text-muted-foreground mb-6">Masukkan PIN untuk melanjutkan</p>
        
        <div className="flex justify-center items-center gap-4 mb-6 h-6">
          {error ? <p className="text-destructive text-sm">PIN Salah</p> : pinDots}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              variant="outline"
              className="h-16 text-2xl font-bold"
              onClick={() => handlePinInput(num.toString())}
            >
              {num}
            </Button>
          ))}
          <Button variant="ghost" className="h-16" onClick={handleClear}>
            <X />
          </Button>
          <Button
            variant="outline"
            className="h-16 text-2xl font-bold"
            onClick={() => handlePinInput('0')}
          >
            0
          </Button>
          <Button className="h-16 bg-green-600 hover:bg-green-700" onClick={handleConfirm}>
            <Check />
          </Button>
        </div>
      </div>
    </div>
  );
}
