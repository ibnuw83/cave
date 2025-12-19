'use client';

import Image from 'next/image';
import { ReactNode } from 'react';

export default function FlatViewer({ imageUrl, children }: { imageUrl: string; children?: ReactNode }) {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
        <Image
            src={imageUrl}
            alt="Spot view"
            fill
            className="object-cover"
            quality={100}
        />
        {children}
    </div>
  );
}
