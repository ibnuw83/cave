
import { getSpot } from '@/lib/firestore';
import { notFound } from 'next/navigation';
import SpotClient from '@/app/components/spot-client';
import { Spot } from '@/lib/types';
import placeholderImagesData from '@/lib/placeholder-images.json';
import { getOfflineCaveData } from '@/lib/offline';

const placeholderImages = placeholderImagesData.placeholderImages;

// Define static spots here as well to handle direct navigation or refresh
const staticSpots: Spot[] = [
    {
        id: 'static-spot-jomblang-light',
        caveId: 'static-jomblang',
        order: 1,
        title: 'Cahaya dari Surga',
        description: 'Sinar matahari yang masuk melalui lubang gua, menciptakan pemandangan magis.',
        imageUrl: placeholderImages.find(p => p.id === 'spot-jomblang-light')?.imageUrl || '',
        isPro: false,
    },
    {
        id: 'static-spot-jomblang-mud',
        caveId: 'static-jomblang',
        order: 2,
        title: 'Jalur Berlumpur (PRO)',
        description: 'Tantangan jalur berlumpur sebelum mencapai dasar gua.',
        imageUrl: placeholderImages.find(p => p.id === 'spot-jomblang-mud')?.imageUrl || '',
        isPro: true,
        effects: { vibrationPattern: [60, 40, 60] }
    },
    {
        id: 'static-spot-gong-stalactite',
        caveId: 'static-gong',
        order: 1,
        title: 'Stalaktit Raksasa',
        description: 'Formasi batuan kapur yang menjulang dari langit-langit gua.',
        imageUrl: placeholderImages.find(p => p.id === 'spot-gong-stalactite')?.imageUrl || '',
        isPro: false,
    },
    {
        id: 'static-spot-gong-pool',
        caveId: 'static-gong',
        order: 2,
        title: 'Kolam Bawah Tanah (PRO)',
        description: 'Kolam air jernih yang terbentuk secara alami di dalam gua.',
        imageUrl: placeholderImages.find(p => p.id === 'spot-gong-pool')?.imageUrl || '',
        isPro: true,
    }
];


export default async function SpotPage({ params }: { params: { id: string } }) {
  let spot: Spot | null = null;
  
  if (params.id.startsWith('static-')) {
    spot = staticSpots.find(s => s.id === params.id) || null;
  } else {
    // For dynamic spots, try to find them in any offline cache first.
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
                              spot = { ...foundSpot, caveId: data.cave.id }; 
                              break;
                          }
                      }
                  }
              }
          }
          if(spot) break;
        }
    } catch (error) {
      console.warn("Could not search offline cache for spot:", error);
    }
    
    // If not found in any offline cache, fetch from Firestore
    if (!spot) {
      try {
        spot = await getSpot(params.id);
      } catch (e) {
        console.error(`Failed to fetch spot ${params.id} from Firestore`, e);
      }
    }
  }
  
  if (!spot) {
    notFound();
  }

  return <SpotClient spot={spot} />;
}
