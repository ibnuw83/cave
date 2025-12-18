'use client';

import { useEffect, useState } from 'react';
import KioskPlayer from './player';
import { ExitPin } from './exit-pin';
import { enterKioskLock, exitKioskLock } from '@/lib/kiosk';
import type { Spot, KioskSettings } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function KiosClient(props: {
  spots: Spot[];
  settings: KioskSettings;
}) {
  const { spots, settings } = props;
  const router = useRouter();

  const [pinOpen, setPinOpen] = useState(false);

  useEffect(() => {
    enterKioskLock();
    
    const blockKeys = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' ||
        (e.ctrlKey && e.key === 'r') ||
        e.key === 'F11'
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', blockKeys);

    return () => { 
        window.removeEventListener('keydown', blockKeys);
        exitKioskLock(); 
    };
  }, []);

  const handleExitSuccess = () => {
    exitKioskLock();
    router.push('/admin/kiosk');
  };

  return (
    <>
      <KioskPlayer
        spots={spots}
        playlist={settings.playlist}
        mode={settings.mode || 'loop'}
        onExitRequested={() => setPinOpen(true)}
      />

      <ExitPin
        open={pinOpen}
        onOpenChange={setPinOpen}
        pin={settings.exitPin || '1234'} // kalau belum ada field, pakai default dulu
        onSuccess={handleExitSuccess}
      />
    </>
  );
}
