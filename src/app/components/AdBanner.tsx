
'use client';

import { useEffect, useState } from 'react';
import { getKioskSettings } from '@/lib/firestore-client';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore } from '@/firebase';

declare global {
  interface Window {
    adsbygoogle: any;
    gtag?: (event: string, action: string, params: object) => void;
  }
}

const AdBanner = () => {
  const [adConfig, setAdConfig] = useState<{ clientId?: string; adSlotId?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const db = useFirestore();

  useEffect(() => {
    if (!db) return;
    getKioskSettings(db)
      .then((settings) => {
        if (settings?.adsense) {
          setAdConfig(settings.adsense);
        }
      })
      .finally(() => setLoading(false));
  }, [db]);

  useEffect(() => {
    if (adConfig?.clientId && adConfig?.adSlotId) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error('AdSense error:', err);
      }
    }
  }, [adConfig]);

  if (loading) {
    return <Skeleton className="my-4 h-24 w-full" />;
  }
  
  if (!adConfig?.clientId || !adConfig?.adSlotId) {
    // If AdSense is not configured, don't render anything
    return null;
  }

  return (
    <div className="my-4 text-center">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adConfig.clientId}
        data-ad-slot={adConfig.adSlotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdBanner;
