
'use client';

import { Suspense, ReactNode, useRef, useState } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Preload } from '@react-three/drei';
import * as THREE from 'three';
import { useIdleAutoRotate } from '@/hooks/useIdleAutoRotate';
import { useGyroOffset } from '@/hooks/use-gyro-offset';

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
  isFull360 = true,
}: {
  imageUrl: string;
  children?: ReactNode;
  isFull360?: boolean;
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
            maxPolarAngle={isFull360 ? Math.PI - 0.01 : Math.PI / 4}

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
