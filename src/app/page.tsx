'use client';

import { useEffect, useState } from 'react';
import { getCaves } from '@/lib/firestore';
import { Cave } from '@/lib/types';
import HomeClient from '@/app/components/home-client';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const [caves, setCaves] = useState<Cave[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCaves() {
      try {
        const cavesData = await getCaves();
        setCaves(cavesData);
      } catch (error) {
        console.error("Failed to fetch caves:", error);
        // Error is handled by the global FirebaseErrorListener
      } finally {
        setLoading(false);
      }
    }
    fetchCaves();
  }, []);

  if (loading) {
     return (
       <div className="container mx-auto min-h-screen max-w-4xl p-4 md:p-8">
        <header className="flex items-center justify-between pb-8">
            <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-40" />
            </div>
            <Skeleton className="h-10 w-24" />
        </header>
        <main>
            <h2 className="mb-6 text-xl font-semibold text-foreground/90 md:text-2xl">Gua yang Tersedia</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </main>
       </div>
     )
  }

  return <HomeClient caves={caves} />;
}
