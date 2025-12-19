'use client';

import { Suspense, useRef, useEffect, ReactNode } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Sphere, Preload } from '@react-three/drei';
import * as THREE from 'three';

function Scene({ imageUrl }: { imageUrl: string }) {
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  texture.mapping = THREE.EquirectangularReflectionMapping;

  return (
    <Sphere args={[500, 60, 40]}>
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </Sphere>
  );
}

export default function PanoramaViewer({
  imageUrl,
  children,
  isFull360 = false,
}: {
  imageUrl: string;
  children?: ReactNode;
  isFull360?: boolean;
}) {
  const controlsRef = useRef<any>(null);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);

  const AUTO_ROTATE_DELAY = 5000;

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const startIdle = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        controls.autoRotate = true;
      }, AUTO_ROTATE_DELAY);
    };

    const stopAuto = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      controls.autoRotate = false;
    };

    startIdle();

    controls.addEventListener('start', stopAuto);
    controls.addEventListener('end', startIdle);

    return () => {
      controls.removeEventListener('start', stopAuto);
      controls.removeEventListener('end', startIdle);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <Canvas>
        <Suspense fallback={null}>
          <Scene imageUrl={imageUrl} />
          <OrbitControls
            ref={controlsRef}
            enableZoom
            enablePan={false}
            rotateSpeed={-0.35}
            autoRotate={false}
            autoRotateSpeed={0.25}
            minPolarAngle={isFull360 ? 0 : Math.PI / 4}
            maxPolarAngle={isFull360 ? Math.PI : Math.PI - Math.PI / 4}
          />
          <Preload all />
        </Suspense>
      </Canvas>

      {children}
    </div>
  );
}
