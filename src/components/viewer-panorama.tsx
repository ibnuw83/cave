'use client';

import { Suspense, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sphere, OrbitControls, Preload } from '@react-three/drei';
import * as THREE from 'three';
import { Hotspot } from '@/lib/types';
import { Hotspot3D } from './Hotspot3D';
import { VRCamera } from './VRCamera';

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
  hotspots = [],
  onNavigate,
  vrMode = false,
  children,
}: {
  imageUrl: string;
  hotspots?: Hotspot[];
  onNavigate?: (spotId: string) => void;
  vrMode?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="relative w-full h-screen bg-black">
      <Canvas
        camera={{ fov: 75, position: [0, 0, 0.1] }}
        onCreated={({ gl }) => {
          gl.domElement.style.touchAction = 'none';
        }}
      >
        <Suspense fallback={null}>
          <Scene imageUrl={imageUrl} />

          {/* HOTSPOT */}
          {hotspots.map(h => (
            <Hotspot3D
              key={h.id}
              hotspot={h}
              onClick={id => onNavigate?.(id)}
            />
          ))}

          {/* VR MODE */}
          <VRCamera enabled={vrMode} />

          {/* NORMAL MODE */}
          {!vrMode && (
            <OrbitControls
              enableZoom
              enablePan={false}
              rotateSpeed={-0.35}
              dampingFactor={0.08}
              enableDamping
            />
          )}

          <Preload all />
        </Suspense>
      </Canvas>

      {/* UI overlay */}
      {children}
    </div>
  );
}
