'use client';

import { useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { Hotspot } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface Hotspot3DProps {
  hotspot: Hotspot;
  onClick: (id: string) => void;
}

export function Hotspot3D({ hotspot, onClick }: Hotspot3DProps) {
  const [hovered, setHovered] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(hotspot.targetSpotId);
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
          <ArrowRight className="h-4 w-4" />
        </button>
      </Html>
    </group>
  );
}
