import { getCave, getSpots } from '@/lib/firestore';
import { notFound } from 'next/navigation';
import CaveClient from '@/app/components/cave-client';

export default async function CavePage({ params }: { params: { id: string } }) {
  const cave = await getCave(params.id);

  if (!cave) {
    notFound();
  }

  const spots = await getSpots(params.id);
  
  return <CaveClient cave={cave} spots={spots} />;
}
