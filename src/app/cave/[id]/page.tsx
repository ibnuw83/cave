import { getCave, getSpots } from '@/lib/firestore';
import { notFound } from 'next/navigation';
import CaveClient from '@/app/components/cave-client';

export default async function CavePage({ params }: { params: { id: string } }) {
  // Fetch from Firestore on the server.
  // The client component will handle checking for offline data first.
  const cave = await getCave(params.id);

  if (!cave) {
    notFound();
  }

  const spots = await getSpots(params.id);
  
  return <CaveClient cave={cave} spots={spots} />;
}
