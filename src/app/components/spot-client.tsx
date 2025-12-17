'use client';

import { useAuth } from '@/context/auth-context';
import { Spot } from '@/lib/types';
import ImmersiveSpot from './immersive-spot';
import LockedScreen from './locked-screen';
import { Skeleton } from '@/components/ui/skeleton';

export default function SpotClient({ spot }: { spot: Spot }) {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-4 p-8">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
          <div className="flex gap-4 pt-4">
            <Skeleton className="h-16 w-1/3" />
            <Skeleton className="h-16 w-1/3" />
            <Skeleton className="h-16 w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  const isLocked = spot.isPro && userProfile?.role === 'free';

  return isLocked ? <LockedScreen spot={spot} /> : <ImmersiveSpot spot={spot} />;
}
