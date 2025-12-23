'use client';

import HomeClient from '@/app/components/home-client';
import { getKioskSettings } from '@/lib/firestore-client';
import { KioskSettings } from '@/lib/types';
import { useEffect, useState } from 'react';

export default function Home() {
  const [settings, setSettings] = useState<KioskSettings | null>(null);
  
  useEffect(() => {
    // Fetch settings on the client side.
    getKioskSettings().then(setSettings).catch(() => setSettings(null));
  }, []);

  // Pass the client-side fetched settings to the client component.
  // It will handle its own loading state for locations.
  return <HomeClient initialSettings={settings} />;
}
