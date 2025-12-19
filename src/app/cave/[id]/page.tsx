

import { getCave, getSpots } from '@/lib/firestore';
import { notFound } from 'next/navigation';
import CaveClient from '@/app/components/cave-client';
import { Cave, Spot } from '@/lib/types';
import placeholderImagesData from '@/lib/placeholder-images.json';
import { getOfflineCaveData } from '@/lib/offline';

const placeholderImages = placeholderImagesData.placeholderImages;

// Define static data here for reliability in case Firestore fails or for examples
const staticCaves: Cave[] = [
    {
        id: 'static-jomblang',
        name: 'Gua Jomblang (Contoh)',
        description: 'Gua vertikal dengan cahaya surga yang menakjubkan.',
        coverImage: placeholderImages.find(p => p.id === 'cave-jomblang-cover')?.imageUrl || '',
        isActive: true,
    },
    {
        id: 'static-gong',
        name: 'Gua Gong (Contoh)',
        description: 'Dijuluki sebagai gua terindah di Asia Tenggara.',
        coverImage: placeholderImages.find(p => p.id === 'cave-gong-cover')?.imageUrl || '',
        isActive: true,
    },
     {
        id: 'static-petruk',
        name: 'Gua Petruk (Contoh)',
        description: 'Gua Petruk di Kebumen adalah destinasi wisata alam karst yang menawarkan pengalaman caving (susur gua) menantang.',
        coverImage: placeholderImages.find(p => p.id === 'cave-petruk-cover')?.imageUrl || '',
        isActive: true,
    }
];


export default async function CavePage({ params }: { params: { id: string } }) {
  let cave: Cave | null = null;
  let spots: Spot[] = [];

  const isStaticExample = params.id.startsWith('static-');

  // --- Logic for both Real and Static data ---
  if (isStaticExample) {
    cave = staticCaves.find(c => c.id === params.id) || null;
  }

  // --- Logic for Firestore/Offline data for REAL IDs ---
  if (!isStaticExample) {
    // 1. Try to load from offline cache first
    try {
      const offlineData = await getOfflineCaveData(params.id);
      if (offlineData) {
        cave = offlineData.cave;
        spots = offlineData.spots;
      }
    } catch (error) {
      console.warn("Could not load from offline cache:", error);
    }

    // 2. If not in cache, fetch from Firestore
    if (!cave) {
      try {
        cave = await getCave(params.id);
      } catch (e) {
         console.error(`Failed to fetch cave ${params.id} from Firestore.`, e);
      }
    }
  }

  // If cave is found (either from static or firestore), fetch its spots
  if (cave) {
    // For static examples, we must define their spots here
    if (isStaticExample) {
         const allStaticSpots = [
          {
              id: 'static-spot-jomblang-light',
              caveId: 'static-jomblang',
              order: 1,
              title: 'Cahaya dari Surga',
              description: 'Sinar matahari yang masuk melalui lubang gua, menciptakan pemandangan magis.',
              imageUrl: placeholderImages.find(p => p.id === 'spot-jomblang-light')?.imageUrl || '',
              isPro: false,
              viewType: 'panorama' as const,
          },
          {
              id: 'static-spot-jomblang-mud',
              caveId: 'static-jomblang',
              order: 2,
              title: 'Jalur Berlumpur (PRO)',
              description: 'Tantangan jalur berlumpur sebelum mencapai dasar gua.',
              imageUrl: placeholderImages.find(p => p.id === 'spot-jomblang-mud')?.imageUrl || '',
              isPro: true,
              viewType: 'flat' as const,
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
              viewType: 'panorama' as const,
          },
          {
              id: 'static-spot-gong-pool',
              caveId: 'static-gong',
              order: 2,
              title: 'Kolam Bawah Tanah (PRO)',
              description: 'Kolam air jernih yang terbentuk secara alami di dalam gua.',
              imageUrl: placeholderImages.find(p => p.id === 'spot-gong-pool')?.imageUrl || '',
              isPro: true,
              viewType: 'flat' as const,
          }
      ];
      spots = allStaticSpots.filter(s => s.caveId === params.id);
    } 
    // For real caves, if spots are not from offline cache, fetch from Firestore
    else if (spots.length === 0) {
       try {
        spots = await getSpots(params.id);
      } catch (e) {
         console.error(`Failed to fetch spots for cave ${params.id} from Firestore.`, e);
         // Set to empty array on failure to prevent showing incorrect static spots
         spots = [];
      }
    }
  }

  // If cave still not found, it's a 404
  if (!cave) {
    notFound();
  }

  return <CaveClient cave={cave} spots={spots} />;
}
