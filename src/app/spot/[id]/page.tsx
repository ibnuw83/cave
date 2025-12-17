import { getSpot } from '@/lib/firestore';
import { notFound } from 'next/navigation';
import SpotClient from '@/app/components/spot-client';
import { getOfflineCaveData } from '@/lib/offline';
import { Spot } from '@/lib/types';

export default async function SpotPage({ params }: { params: { id: string } }) {
  let spot: Spot | null = null;
  let isOffline = false;

  // We need to find which cave this spot belongs to in the offline cache.
  // This is a limitation of the current cache structure.
  // A more robust solution might use IndexedDB for better querying.
  try {
      const cachesKeys = await caches.keys();
      for (const key of cachesKeys) {
        if (key.startsWith('penjelajah-gua-offline-v1')) {
            const cache = await caches.open(key);
            const responses = await cache.keys();
            for (const request of responses) {
                const response = await cache.match(request);
                if (response) {
                    const data = await response.json();
                    if (data && data.spots) {
                        const foundSpot = data.spots.find((s: Spot) => s.id === params.id);
                        if (foundSpot) {
                            spot = foundSpot;
                            isOffline = true;
                            // Also need to get the cave data for the back button
                            spot.caveId = data.cave.id; 
                            break;
                        }
                    }
                }
            }
        }
        if(spot) break;
      }
  } catch (error) {
    console.warn("Could not search offline cache:", error);
  }
  
  // If not found in any offline cache, fetch from Firestore
  if (!spot) {
    spot = await getSpot(params.id);
  }
  
  if (!spot) {
    notFound();
  }

  return <SpotClient spot={spot} />;
}
