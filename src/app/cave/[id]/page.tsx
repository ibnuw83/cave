
import { getCave, getSpots } from '@/lib/firestore';
import { notFound } from 'next/navigation';
import CaveClient from '@/app/components/cave-client';
import { getOfflineCaveData } from '@/lib/offline';
import { Cave, Spot } from '@/lib/types';
import placeholderImagesData from '@/lib/placeholder-images.json';

const placeholderImages = placeholderImagesData.placeholderImages;

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


export default async function CavePage({ params }: { params: { id: string } }) {
  let cave: Cave | null = null;
  let spots: Spot[] = [];

  // If it's a static example, create the data directly
  if (params.id.startsWith('static-')) {
    const staticCaveId = params.id;
    const placeholderCave = placeholderImages.find(p => p.id.includes(staticCaveId.replace('static-', '')));
    
    if (placeholderCave) {
        cave = {
            id: staticCaveId,
            name: staticCaveId.replace('static-','').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            description: placeholderCave.description,
            coverImage: placeholderCave.imageUrl,
            isActive: true
        };
        spots = staticSpots.filter(s => s.caveId === staticCaveId);
    }
  } else {
    // --- Original logic for Firestore data ---
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
  
    // 3. If spots were not in cache, fetch them now
    if (spots.length === 0 && cave) {
      spots = await getSpots(params.id);
    }
  }


  // If cave still not found, it's a 404
  if (!cave) {
    notFound();
  }
  
  return <CaveClient cave={cave} spots={spots} />;
}
