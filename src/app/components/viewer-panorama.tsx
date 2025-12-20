'use client';

import { Suspense, ReactNode, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { Sphere, OrbitControls, Preload } from '@react-three/drei';
import * as THREE from 'three';
import { Hotspot } from '@/lib/types';
import { Hotspot3D } from '@/app/components/Hotspot3D';
import { VRCamera } from '@/app/components/VRCamera';
import { MiniMap } from '@/app/components/mini-map';
import { petrukMiniMap } from '@/lib/maps/petruk';


function Scene({ imageUrl, onHeadingChange }: { imageUrl: string, onHeadingChange: (heading: number) => void }) {
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  texture.mapping = THREE.EquirectangularReflectionMapping;

  const { camera } = useThree();

  useFrame(() => {
    // Convert rotation.y (radians) to degrees for the heading
    const headingDegrees = THREE.MathUtils.radToDeg(camera.rotation.y);
    onHeadingChange(headingDegrees);
  });

  return (
    <Sphere args={[500, 60, 40]} scale={[-1, 1, 1]}>
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </Sphere>
  );
}

function DollyControls() {
    const { camera, gl: { domElement } } = useThree();
    const isInteracting = useRef(false);
    const lastPinchDistance = useRef(0);

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const direction = camera.getWorldDirection(new THREE.Vector3());
            const moveSpeed = e.deltaY * -0.0005;
            camera.position.addScaledVector(direction, moveSpeed);
        };
        
        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                isInteracting.current = true;
                lastPinchDistance.current = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (isInteracting.current && e.touches.length === 2) {
                 const newPinchDistance = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
                const delta = lastPinchDistance.current - newPinchDistance;
                const direction = camera.getWorldDirection(new THREE.Vector3());
                const moveSpeed = delta * 0.002;
                camera.position.addScaledVector(direction, moveSpeed);
                lastPinchDistance.current = newPinchDistance;
            }
        };

        const handleTouchEnd = () => {
            isInteracting.current = false;
        };


        domElement.addEventListener('wheel', handleWheel, { passive: false });
        domElement.addEventListener('touchstart', handleTouchStart);
        domElement.addEventListener('touchmove', handleTouchMove);
        domElement.addEventListener('touchend', handleTouchEnd);


        return () => {
            domElement.removeEventListener('wheel', handleWheel);
            domElement.removeEventListener('touchstart', handleTouchStart);
            domElement.removeEventListener('touchmove', handleTouchMove);
            domElement.removeEventListener('touchend', handleTouchEnd);
        };
    }, [camera, domElement]);

    return null;
}


export default function PanoramaViewer({
  imageUrl,
  hotspots = [],
  spotId, // Tambahkan spotId untuk MiniMap
  onNavigate,
  vrMode = false,
  children,
}: {
  imageUrl: string;
  hotspots?: Hotspot[];
  spotId?: string;
  onNavigate?: (spotId: string) => void;
  vrMode?: boolean;
  children?: ReactNode;
}) {

  const [heading, setHeading] = useState(0);

  // A simple check to see if we should show the Petruk map.
  const showMiniMap = spotId && petrukMiniMap.nodes.some(n => n.id === spotId);

  return (
    <div className="relative w-full h-screen bg-black">
      <Canvas
        camera={{ fov: 75, position: [0, 0, 0.1] }}
        onCreated={({ gl }) => {
          gl.domElement.style.touchAction = 'none';
        }}
      >
        <Suspense fallback={null}>
          <Scene imageUrl={imageUrl} onHeadingChange={setHeading} />

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
            <>
              <OrbitControls
                enableZoom={false} // Disable default zoom
                enablePan={false}
                rotateSpeed={-0.35}
                dampingFactor={0.08}
                enableDamping
              />
              <DollyControls />
            </>
          )}

          <Preload all />
        </Suspense>
      </Canvas>
      
       {showMiniMap && spotId && onNavigate && (
        <MiniMap 
          map={petrukMiniMap} 
          activeSpotId={spotId} 
          onNavigate={onNavigate}
          heading={heading} 
        />
      )}

      {/* UI overlay */}
      {children}
    </div>
  );
}
