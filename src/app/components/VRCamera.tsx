'use client';

import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useEffect, useRef } from 'react';

export function VRCamera({ enabled }: { enabled: boolean }) {
  const { camera } = useThree();
  const baseAlpha = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    function onOrientation(e: DeviceOrientationEvent) {
      if (e.alpha == null || e.beta == null) return;

      if (baseAlpha.current === null) {
        baseAlpha.current = e.alpha;
      }

      const lon = -(e.alpha - baseAlpha.current);
      const lat = Math.max(-85, Math.min(85, e.beta - 90));

      camera.rotation.set(
        THREE.MathUtils.degToRad(lat),
        THREE.MathUtils.degToRad(lon),
        0,
        'YXZ' // Order of rotation: yaw, pitch, roll
      );
    }

    window.addEventListener('deviceorientation', onOrientation);
    return () => window.removeEventListener('deviceorientation', onOrientation);
  }, [enabled, camera]);

  return null;
}
