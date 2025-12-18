
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
  const [gyroEnabled, setGyroEnabled] = useState(false);
  const [ori, setOri] = useState<Orientation>({ yaw: 0, pitch: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect if the device is likely a mobile device.
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const requestGyro = async () => {
    // iOS needs permission
    const anyDO: any = DeviceOrientationEvent;
    if (typeof anyDO.requestPermission === 'function') {
      try {
        const res = await anyDO.requestPermission();
        if (res !== 'granted') return;
      } catch (error) {
        console.error("Gyro permission request failed:", error);
        return;
      }
    }
    setGyroEnabled(true);
  };

  // Gyroscope effect
  useEffect(() => {
    if (!gyroEnabled) return;

    const handler = (e: DeviceOrientationEvent) => {
      const yaw = (e.gamma ?? 0) * strength;
      const pitch = (e.beta ?? 0) * strength;

      setOri({
        yaw: clamp(yaw, -35, 35),
        pitch: clamp(pitch, -25, 25),
      });
    };

    window.addEventListener('deviceorientation', handler, true);
    return () => window.removeEventListener('deviceorientation', handler, true);
  }, [gyroEnabled, strength]);
  
  // Mouse move effect for desktop
  useEffect(() => {
    // Don't run mouse controls if gyro is active
    if (gyroEnabled || !containerRef.current) return;

    const handler = (e: MouseEvent) => {
        const rect = containerRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate position as a percentage from the center
        const yawPercent = (mouseX / rect.width - 0.5) * 2; // -1 to 1
        const pitchPercent = (mouseY / rect.height - 0.5) * 2; // -1 to 1

        const YAW_RANGE = 20;
        const PITCH_RANGE = 15;

        setOri({
            yaw: yawPercent * YAW_RANGE,
            pitch: pitchPercent * PITCH_RANGE,
        });
    };
    
    const leaveHandler = () => {
        // Reset to center when mouse leaves
        setOri({ yaw: 0, pitch: 0 });
    }

    const el = containerRef.current;
    el.addEventListener('mousemove', handler);
    el.addEventListener('mouseleave', leaveHandler);

    return () => {
        el.removeEventListener('mousemove', handler);
        el.removeEventListener('mouseleave', leaveHandler);
    }
  }, [gyroEnabled]);

  const transform = useMemo(() => {
    return `translate3d(${ori.yaw * -3}px, ${ori.pitch * -3}px, 0) scale(1.15)`;
  }, [ori]);

  return (
    <div ref={containerRef} className={cn('relative w-full h-full overflow-hidden bg-black', className)}>
      <div
        className="absolute inset-0 bg-center bg-cover transition-transform duration-100 ease-linear"
        style={{ backgroundImage: `url(${imageUrl})`, transform }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      {isMobile && !gyroEnabled && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Button onClick={requestGyro}>Aktifkan Mode Gyro</Button>
        </div>
      )}

      {gyroEnabled && (
        <div className="absolute bottom-3 left-3 text-xs text-white/70 z-10 bg-black/50 px-2 py-1 rounded">
          Gyro ON • yaw {ori.yaw.toFixed(0)}° • pitch {ori.pitch.toFixed(0)}°
        </div>
      )}
    </div>
  );
}
