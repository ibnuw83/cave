
'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Sphere, Preload } from '@react-three/drei';
import * as THREE from 'three';

function Scene({ imageUrl }: { imageUrl: string }) {
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  const controlsRef = useRef<any>();

  // Ensure texture is treated as equirectangular
  if (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
  }

  return (
    <>
      <Sphere args={[500, 60, 40]}>
        <meshBasicMaterial map={texture} side={THREE.BackSide} />
      </Sphere>
      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        rotateSpeed={-0.4} // Invert direction for intuitive dragging
        target={[0, 0, 0]}
      />
    </>
  );
}

export default function PanoramaViewer({ imageUrl }: { imageUrl: string }) {
  return (
    <Canvas>
      <Suspense fallback={null}>
        <Scene imageUrl={imageUrl} />
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
