'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Preload, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { Skeleton } from '@/components/ui/skeleton';

function Scene({ imageUrl }: { imageUrl: string }) {
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  const sphereRef = useRef<THREE.Mesh>(null!);

  // Ini akan memetakan tekstur ke bagian dalam bola
  texture.mapping = THREE.EquirectangularReflectionMapping;

  return (
    <Sphere ref={sphereRef} args={[500, 60, 40]}>
      {/* Skala diatur ke -1 agar kita bisa melihat dari dalam */}
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </Sphere>
  );
}

export default function PanoramaViewer({ imageUrl }: { imageUrl: string }) {
  return (
    <Canvas camera={{ position: [0, 0, 0.1] }}>
      <Suspense fallback={<Skeleton className="w-full h-full" />}>
        <Scene imageUrl={imageUrl} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={-0.4} // Balik arah rotasi agar lebih intuitif
          autoRotate={false}
          autoRotateSpeed={0.5}
        />
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
