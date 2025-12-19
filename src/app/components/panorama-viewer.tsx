'use client';

import { ReactNode } from 'react';
import { Pannellum } from "pannellum-react";

export function PanoramaViewer({ imageUrl, children }: { imageUrl: string, children: ReactNode }) {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
        <Pannellum
            width="100%"
            height="100%"
            image={imageUrl}
            pitch={-10}
            yaw={180}
            hfov={110}
            autoLoad
            crossOrigin="anonymous"
            showZoomCtrl={false}
            mouseZoom={false}
            onLoad={() => {
                console.log("Panorama loaded");
            }}
        >
        </Pannellum>
        {children}
    </div>
  );
}
