'use client';

import { ReactNode } from 'react';

export default function FlatViewer({ imageUrl, children }: { imageUrl: string; children?: ReactNode }) {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
        <img
            src={imageUrl}
            alt="Spot view"
            className="absolute inset-0 w-full h-full object-cover cursor-grab"
            draggable={false}
        />
        {children}
    </div>
  );
}
