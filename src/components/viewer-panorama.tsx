
'use client';

import { Suspense, useRef, useEffect, ReactNode } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Sphere, Preload } from '@react-three/drei';
import * as THREE from 'three';
import { useIdleAutoRotate } from '@/hooks/useIdleAutoRotate';

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
  const { isIdle, markActive } = useIdleAutoRotate({ idleMs: 5000 });
  
  useEffect(() => {
    const controls = controlsRef.current;
    if (controls) {
      controls.autoRotate = isIdle;
    }
  }, [isIdle]);

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
            autoRotate={false} // Dikelola oleh state
            autoRotateSpeed={0.25}
            minPolarAngle={isFull360 ? 0 : Math.PI / 4}
            maxPolarAngle={isFull360 ? Math.PI : Math.PI - Math.PI / 4}
            onStart={markActive} // Tandai aktif saat interaksi dimulai
            onEnd={markActive} // Tandai aktif saat interaksi berakhir
          />
          <Preload all />
        </Suspense>
      </Canvas>

      {children}
    </div>
  );
}
