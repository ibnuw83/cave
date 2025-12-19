'use client';

import { useEffect, useState, ReactNode } from 'react';
import { detectViewType } from '@/lib/view-type';
import FlatViewer from './viewer-flat';
import PanoramaViewer from './viewer-panorama';
import { Skeleton } from './ui/skeleton';

export default function HybridViewer({
  imageUrl,
  children,
  forcedType,
}: {
  imageUrl: string;
  children?: ReactNode;
  forcedType?: 'auto' | 'flat' | 'panorama' | 'full360';
}) {
  const [type, setType] = useState<'flat' | 'panorama' | 'full360' | 'detecting'>('detecting');

  useEffect(() => {
    // Reset to detecting when image changes
    setType('detecting');
    
    if (forcedType && forcedType !== 'auto') {
      setType(forcedType);
    } else {
      detectViewType(imageUrl).then(setType);
    }
  }, [imageUrl, forcedType]);

  if (type === 'detecting') {
      return <Skeleton className="h-screen w-screen" />;
  }

  if (type === 'flat') {
    return <FlatViewer imageUrl={imageUrl}>{children}</FlatViewer>;
  }

  return (
    <PanoramaViewer imageUrl={imageUrl} isFull360={type === 'full360'}>
      {children}
    </PanoramaViewer>
  );
}
