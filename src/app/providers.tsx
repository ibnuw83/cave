'use client';

import { useEffect } from 'react';
import { initPermissionToast } from '@/lib/permission-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPermissionToast();
  }, []);

  return <>{children}</>;
}
