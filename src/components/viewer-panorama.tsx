
'use client';

import { Suspense, ReactNode, useRef, useState } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Preload, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useIdleAutoRotate } from '@/hooks/useIdleAutoRotate';
import { useGyroOffset } from '@/hooks/useGyroOffset';
import type { Hotspot } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

function Scene({ imageUrl }: { imageUrl: string }) {
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  texture.mapping = THREE.EquirectangularReflectionMapping;

  return (
    <Sphere args={[500, 60, 40]}>
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </Sphere>
  );
}

function HotspotPoint({ hotspot }: { hotspot: Hotspot }) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  const handleClick = (e: any) => {
    e.stopPropagation();
    router.push(`/spot/${hotspot.targetSpotId}`);
  };

  return (
    <group position={new THREE.Vector3(...hotspot.position)}>
      <Html 
        center
        distanceFactor={10}
        occlude
        onOcclude={setHovered as any}
        style={{
          transition: 'all 0.2s',
          transform: `scale(${hovered ? 1.2 : 1})`,
          opacity: hovered ? 1 : 0.7,
        }}
      >
        <button
          onClick={handleClick}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          className={cn(
            "flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-white backdrop-blur-md transition-all duration-300 hover:bg-black/70 hover:!opacity-100",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-transparent"
          )}
        >
          <span>{hotspot.label}</span>
          <ArrowRight className="h-4 w-4"/>
        </button>
      </Html>
    </group>
  );
}


export default function PanoramaViewer({
  imageUrl,
  children,
  isFull360 = true,
  hotspots = [],
}: {
  imageUrl: string;
  children?: ReactNode;
  isFull360?: boolean;
  hotspots?: Hotspot[];
}) {
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  const { isIdle, markActive } = useIdleAutoRotate({ idleMs: 5000 });
  const [isInteracting, setIsInteracting] = useState(false);

  const gyro = useGyroOffset(!isInteracting);

  // 🔄 update tiap frame
  useFrame(() => {
    const controls = controlsRef.current;
    const cam = cameraRef.current;
    if (!controls || !cam) return;

    // Auto rotate kalau idle
    controls.autoRotate = isIdle;

    // Gyro offset → rotasi kamera
    if (!isInteracting) {
      cam.rotation.y = THREE.MathUtils.degToRad(gyro.current.lon);
      cam.rotation.x = THREE.MathUtils.degToRad(gyro.current.lat);
    }
    
    controls.update();
  });

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <Canvas
        camera={{ fov: 75, position: [0, 0, 0.1] }}
        onCreated={({ camera, gl }) => {
          cameraRef.current = camera as THREE.PerspectiveCamera;
          gl.domElement.style.touchAction = 'none'; // ⬅️ wajib untuk pinch
        }}
      >
        <Suspense fallback={null}>
          <Scene imageUrl={imageUrl} />
          
          {hotspots.map(hotspot => <HotspotPoint key={hotspot.id} hotspot={hotspot} />)}

          <OrbitControls
            ref={controlsRef}
            enableZoom
            enablePan={false}

            // 🔥 pinch zoom natural
            minDistance={0.1}
            maxDistance={10}
            zoomSpeed={1.2}

            // rotasi
            rotateSpeed={-0.35}

            // auto rotate
            autoRotate={false}
            autoRotateSpeed={0.25}

            enableDamping
            dampingFactor={0.07}

            minPolarAngle={isFull360 ? 0.01 : Math.PI / 4}
            maxPolarAngle={isFull360 ? Math.PI - 0.01 : Math.PI - 0.01}

            onStart={() => {
              setIsInteracting(true);
              markActive();
            }}
            onEnd={() => {
              setIsInteracting(false);
              markActive();
            }}
          />

          <Preload all />
        </Suspense>
      </Canvas>

      {children}
    </div>
  );
}
