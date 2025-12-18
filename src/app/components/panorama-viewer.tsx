
'use client';

import { ReactNode } from 'react';
import { Pannellum } from "react-pannellum-next";

export function PanoramaViewer({ imageUrl, children }: { imageUrl: string, children: ReactNode }) {
  return (
    <div className="relative w-full h-screen bg-black">
      <Pannellum
        width="100%"
        height="100%"
        image={imageUrl}
        pitch={10}
        yaw={180}
        hfov={110}
        autoLoad
        showZoomCtrl={false}
        showFullscreenCtrl={false}
        onLoad={() => {
          console.log("Panorama loaded");
        }}
        // @ts-ignore
        image-crossorigin="anonymous"
      >
      </Pannellum>
      {children}
    </div>
  );
}
