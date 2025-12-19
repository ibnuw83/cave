
'use client';

import { Suspense, useRef, ReactNode } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
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

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isIdle;
      // You must call update() when damping is enabled
      controlsRef.current.update();
    }
  });

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <Canvas
        onPointerDown={markActive}
        onWheel={markActive}
      >
        <Suspense fallback={null}>
          <Scene imageUrl={imageUrl} />
          <OrbitControls
            ref={controlsRef}
            enableZoom
            enablePan={false}
            rotateSpeed={-0.35}
            autoRotate={false} // Dikelola oleh useFrame
            autoRotateSpeed={0.25}
            enableDamping
            dampingFactor={0.06}
            minPolarAngle={isFull360 ? 0.01 : Math.PI / 4}
            maxPolarAngle={isFull360 ? Math.PI - 0.01 : Math.PI - Math.PI / 4}
          />
          <Preload all />
        </Suspense>
      </Canvas>

      {children}
    </div>
  );
}
