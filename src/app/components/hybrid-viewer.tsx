
'use client';

import { useEffect, useState, ReactNode } from 'react';
import { detectViewType } from '@/lib/view-type';
import FlatViewer from './viewer-flat';
import PanoramaViewer from './viewer-panorama';
import { Skeleton } from '@/components/ui/skeleton';


export default function HybridViewer({
  imageUrl,
  children,
  forcedType,
}: {
  imageUrl: string;
  children?: ReactNode;
  forcedType?: 'auto' | 'flat' | 'panorama' | 'full360';
}) {
  const [type, setType] = useState<'flat' | 'panorama' | 'full360' | 'loading'>('loading');

  useEffect(() => {
    let isCancelled = false;
    setType('loading');
    
    if (forcedType && forcedType !== 'auto') {
      setType(forcedType);
    } else {
      detectViewType(imageUrl).then(detectedType => {
        if (!isCancelled) {
          setType(detectedType);
        }
      });
    }
    
    return () => {
        isCancelled = true;
    }

  }, [imageUrl, forcedType]);
  
  if (type === 'loading') {
    return <Skeleton className="w-screen h-screen" />;
  }

  if (type === 'flat') {
    return <FlatViewer imageUrl={imageUrl}>{children}</FlatViewer>;
  }

  // For both 'panorama' and 'full360'
  return (
    <PanoramaViewer imageUrl={imageUrl}>
      {children}
    </PanoramaViewer>
  );
}
