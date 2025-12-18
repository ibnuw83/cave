import { getCave, getSpots } from '@/lib/firestore';
import { notFound } from 'next/navigation';
import CaveClient from '@/app/components/cave-client';
import { getOfflineCaveData } from '@/lib/offline';
import { Cave, Spot } from '@/lib/types';

export default async function CavePage({ params }: { params: { id: string } }) {
  let cave: Cave | null = null;
  let spots: Spot[] = [];

  // 1. Try to load from offline cache first
  try {
    const offlineData = await getOfflineCaveData(params.id);
    if (offlineData) {
      cave = offlineData.cave;
      spots = offlineData.spots;
    }
  } catch (error) {
    console.warn("Could not search offline cache:", error);
  }

  // 2. If not in cache, fetch from Firestore
  if (!cave) {
    cave = await getCave(params.id);
  }

  // If cave still not found, it's a 404
  if (!cave) {
    notFound();
  }
  
  // If spots were not in cache, fetch them now
  if (spots.length === 0) {
    spots = await getSpots(params.id);
  }
  
  return <CaveClient cave={cave} spots={spots} />;
}
