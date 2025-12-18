
import { getSpot, getUserProfile } from '@/lib/firestore';
import { notFound } from 'next/navigation';
import { Spot } from '@/lib/types';
import placeholderImagesData from '@/lib/placeholder-images.json';
import { getOfflineCaveData } from '@/lib/offline';
import { cookies } from 'next/headers';
import { auth } from '@/lib/firebase-admin';
import LockedScreen from '@/app/components/locked-screen';
import { GyroViewer } from '@/app/components/gyro-viewer';
import SpotPlayerUI from '@/app/components/spot-player-ui';

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
    // 1. Try to fetch from Firestore
    try {
      spot = await getSpot(params.id);
    } catch (e) {
      console.error(`Failed to fetch spot ${params.id} from Firestore`, e);
    }

    // 2. If not found in Firestore, try to load from any available offline cache as a fallback.
    // This is less direct, but can work if the user has previously saved a cave containing this spot.
    if (!spot) {
        try {
            const offlineCaves = await caches.keys().then(keys => 
                Promise.all(keys
                    .filter(key => key.startsWith('penjelajah-gua-offline-v1'))
                    .map(key => caches.open(key).then(cache => cache.match(key).then(res => res ? res.json() : null)))
                )
            );
            for (const data of offlineCaves) {
                if (data && data.spots) {
                    const foundSpot = data.spots.find((s: Spot) => s.id === params.id);
                    if (foundSpot) {
                        spot = { ...foundSpot, caveId: data.cave.id }; 
                        break;
                    }
                }
            }
        } catch(e) {
            console.warn("Could not search offline cache for spot:", e);
        }
    }
  }
  
  if (!spot) {
    notFound();
  }

  // --- Auth Check (Server Side) ---
  let userRole = 'free';
  try {
    const sessionCookie = cookies().get('__session')?.value;
    if (sessionCookie) {
      const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
      const userProfile = await getUserProfile(decodedToken.uid);
      if (userProfile) {
        userRole = userProfile.role;
      }
    }
  } catch (error) {
    console.log('User not logged in or session expired');
  }

  const isLocked = spot.isPro && userRole === 'free';
  
  if(isLocked) {
    return <LockedScreen spot={spot} />;
  }

  return (
    <GyroViewer imageUrl={spot.imageUrl}>
       <SpotPlayerUI spot={spot} />
    </GyroViewer>
  );
}
