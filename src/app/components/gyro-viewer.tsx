'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Orientation = { yaw: number; pitch: number };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function GyroViewer(props: {
  imageUrl: string;
  className?: string;
  strength?: number; // 0.6–1.2
}) {
  const { imageUrl, className, strength = 0.9 } = props;
  const [enabled, setEnabled] = useState(false);
  const [ori, setOri] = useState<Orientation>({ yaw: 0, pitch: 0 });

  const request = async () => {
    // iOS needs permission
    const anyDO: any = DeviceOrientationEvent;
    if (typeof anyDO.requestPermission === 'function') {
      try {
        const res = await anyDO.requestPermission();
        if (res !== 'granted') return;
      } catch (error) {
        console.error("Gyro permission request failed:", error);
        // Show a toast or message to the user that it failed
        return;
      }
    }
    setEnabled(true);
  };

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: DeviceOrientationEvent) => {
      // gamma: left-right, beta: front-back, alpha: compass-ish
      const yaw = (e.gamma ?? 0) * strength;  // -90..90
      const pitch = (e.beta ?? 0) * strength; // -180..180

      setOri({
        yaw: clamp(yaw, -35, 35),
        pitch: clamp(pitch, -25, 25),
      });
    };

    window.addEventListener('deviceorientation', handler, true);
    return () => window.removeEventListener('deviceorientation', handler, true);
  }, [enabled, strength]);

  const transform = useMemo(() => {
    // “window” effect: move background opposite direction
    return `translate3d(${ori.yaw * -3}px, ${ori.pitch * -3}px, 0) scale(1.08)`;
  }, [ori]);

  return (
    <div className={cn('relative w-full h-full overflow-hidden bg-black', className)}>
      <div
        className="absolute inset-0 bg-center bg-cover transition-transform duration-100 ease-linear"
        style={{ backgroundImage: `url(${imageUrl})`, transform }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      {!enabled && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Button onClick={request}>Aktifkan Mode Gyro</Button>
        </div>
      )}

      {enabled && (
        <div className="absolute bottom-3 left-3 text-xs text-white/70 z-10">
          Gyro ON • yaw {ori.yaw.toFixed(0)}° • pitch {ori.pitch.toFixed(0)}°
        </div>
      )}
    </div>
  );
}
