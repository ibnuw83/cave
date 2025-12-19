'use client';

import { useEffect, useRef } from 'react';

export function useGyroOffset(enabled: boolean) {
  const offset = useRef({ lon: 0, lat: 0 });
  const baseAlpha = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    function onOrientation(e: DeviceOrientationEvent) {
      if (e.alpha == null || e.beta == null) return;

      if (baseAlpha.current === null) {
        baseAlpha.current = e.alpha;
      }

      offset.current.lon = -(e.alpha - baseAlpha.current);
      offset.current.lat = Math.max(-85, Math.min(85, e.beta - 90));
    }

    window.addEventListener('deviceorientation', onOrientation);
    return () => window.removeEventListener('deviceorientation', onOrientation);
  }, [enabled]);

  return offset;
}
