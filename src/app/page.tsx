'use client';

import HomeClient from '@/app/components/home-client';
import { getCaves } from '@/lib/firestore';
import { Cave } from '@/lib/types';
import { useEffect, useState } from 'react';


export default function Home() {
  const [initialCaves, setInitialCaves] = useState<Cave[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCaves(false).then((caves) => {
      setInitialCaves(caves);
      setLoading(false);
    }).catch(err => {
        console.error("Failed to fetch caves", err);
        setLoading(false);
    })
  }, []);
  
  if (loading) {
      // You can return a loading skeleton here
      return <div className="flex h-screen w-full items-center justify-center bg-background">Loading...</div>;
  }

  return (
    <HomeClient initialCaves={initialCaves} />
  );
}
