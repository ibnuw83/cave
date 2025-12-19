'use client';

import { Suspense, useRef, ReactNode } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Preload, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { Skeleton } from '@/components/ui/skeleton';

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
    isFull360 = false
}: { 
    imageUrl: string; 
    children?: ReactNode,
    isFull360?: boolean
}) {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
        <Canvas camera={{ position: [0, 0, 0.1] }}>
            <Suspense fallback={<Skeleton className="w-full h-full" />}>
                <Scene imageUrl={imageUrl} />
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    rotateSpeed={-0.4}
                    autoRotate={false}
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
