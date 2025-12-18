'use client';

// Import to register the permission toast listener globally.
import '@/lib/permission-toast';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  // The permission toast initialization is now handled by importing
  // the module, so no useEffect is needed here.
  return <>{children}</>;
}
