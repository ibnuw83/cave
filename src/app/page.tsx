'use server';

import { getCaves } from '@/lib/firestore';
import HomeClient from '@/app/components/home-client';
import { Skeleton } from '@/components/ui/skeleton';

export default async function Home() {
  // Fetch caves on the server
  const caves = await getCaves(false);

  return <HomeClient caves={caves} />;
}
