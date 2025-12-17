'use client';

import HomeClient from '@/app/components/home-client';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';

export default function Home() {
  const [caves, setCaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Since HomeClient now fetches its own data, we can simplify this page.
  // We'll keep the top-level loading skeleton based on auth state for a better initial load experience.
  const { loading: authLoading } = useAuth();

  if (authLoading) {
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
     );
  }

  return <HomeClient />;
}
