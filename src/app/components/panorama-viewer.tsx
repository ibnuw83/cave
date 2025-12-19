'use client';

import { ReactNode, Suspense, useRef } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Sphere, Preload } from '@react-three/drei';
import * as THREE from 'three';

function Scene({ imageUrl }: { imageUrl: string }) {
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  
  // Invert the texture horizontally to correct the view from inside the sphere
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.x = -1;

  return (
    <Sphere args={[500, 60, 40]}>
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </Sphere>
  );
}

export function PanoramaViewer({ imageUrl, children }: { imageUrl: string, children: ReactNode }) {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <Canvas>
        <Suspense fallback={null}>
          <Scene imageUrl={imageUrl} />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableDamping
            dampingFactor={0.2}
            autoRotate={false}
            rotateSpeed={-0.5} // Invert rotation direction
          />
          <Preload all />
        </Suspense>
      </Canvas>
      {children}
    </div>
  );
}
