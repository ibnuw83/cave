
import Link from 'next/link';
import { Cave, KioskSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Mountain } from 'lucide-react';
import HomeClient from '@/app/components/home-client';
import { getCaves, getKioskSettings } from '@/lib/firestore';

// This is now a Server Component that fetches data directly.
export default async function Home() {
  // Fetch active caves directly on the server.
  // The client component will only handle UI interaction.
  const initialCaves = await getCaves(false);
  
  return (
    <HomeClient initialCaves={initialCaves} />
  );
}
