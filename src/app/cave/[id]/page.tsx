
'use client';

import { useEffect, useState } from 'react';
import { getCave, getSpots } from '@/lib/firestore';
import { notFound, useParams } from 'next/navigation';
import CaveClient from '@/app/components/cave-client';
import { Cave, Spot } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

export default function CavePage() {
  const params = useParams();
  const caveId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [cave, setCave] = useState<Cave | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!caveId) return;

    async function fetchData() {
      try {
        setLoading(true);
        const [caveData, spotsData] = await Promise.all([
          getCave(caveId),
          getSpots(caveId)
        ]);

        if (!caveData) {
          setError(true);
          return;
        }

        setCave(caveData);
        setSpots(spotsData);
      } catch (err) {
        console.error("Failed to fetch cave data:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [caveId]);

  if (loading) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Memuat data gua...</p>
        </div>
      </div>
    );
  }

  if (error) {
    notFound();
  }
  
  if (!cave) {
    return null; // Should be handled by notFound
  }

  return <CaveClient cave={cave} spots={spots} />;
}
