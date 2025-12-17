import { getCave, getSpots } from '@/lib/firestore';
import { notFound } from 'next/navigation';
import CaveClient from '@/app/components/cave-client';
import { getOfflineCaveData } from '@/lib/offline';

export default async function CavePage({ params }: { params: { id: string } }) {
  // Try fetching from offline cache first.
  const offlineData = await getOfflineCaveData(params.id);

  if (offlineData) {
    return <CaveClient cave={offlineData.cave} spots={offlineData.spots} />;
  }

  // If not found offline, fetch from Firestore.
  const cave = await getCave(params.id);

  if (!cave) {
    notFound();
  }

  const spots = await getSpots(params.id);
  
  return <CaveClient cave={cave} spots={spots} />;
}
