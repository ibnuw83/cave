
import { getCave, getSpots } from '@/lib/firestore';
import { notFound } from 'next/navigation';
import CaveClient from '@/app/components/cave-client';
import { Cave, Spot } from '@/lib/types';
import { getOfflineCaveData } from '@/lib/offline';

export default async function CavePage({ params }: { params: { id: string } }) {
  let cave: Cave | null = null;
  let spots: Spot[] = [];

  // Flag to check if spots were loaded from offline cache
  let spotsLoadedFromCache = false;

  // 1. Try to load from offline cache first
  try {
    const offlineData = await getOfflineCaveData(params.id);
    if (offlineData) {
      cave = offlineData.cave;
      spots = offlineData.spots;
      spotsLoadedFromCache = true;
    }
  } catch (error) {
    console.warn("Could not load from offline cache:", error);
  }

  // 2. If cave not found in cache, fetch from Firestore
  if (!cave) {
    try {
      cave = await getCave(params.id);
    } catch (e) {
      console.error(`Failed to fetch cave ${params.id} from Firestore.`, e);
    }
  }

  // 3. If cave is found, fetch its spots ONLY if not already loaded from cache
  if (cave && !spotsLoadedFromCache) {
    try {
      spots = await getSpots(params.id);
    } catch (e) {
      console.error(`Failed to fetch spots for cave ${params.id} from Firestore.`, e);
      // Set to empty array on failure
      spots = [];
    }
  }

  // 4. If cave still not found, it's a 404
  if (!cave) {
    notFound();
  }

  return <CaveClient cave={cave} spots={spots} />;
}
