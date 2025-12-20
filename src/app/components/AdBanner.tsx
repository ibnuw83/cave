
'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle: any;
  }
}

const AdBanner = () => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error(err);
    }
  }, []);

  return (
    <div className="my-4 text-center">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="YOUR_ADSENSE_CLIENT_ID" // TODO: Ganti dengan ID Klien AdSense Anda
        data-ad-slot="YOUR_AD_SLOT_ID" // TODO: Ganti dengan ID Slot Iklan Anda
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdBanner;
