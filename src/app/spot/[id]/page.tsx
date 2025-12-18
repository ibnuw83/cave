
import { getSpotAdmin, getUserProfileAdmin } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';
import { Spot } from '@/lib/types';
import placeholderImagesData from '@/lib/placeholder-images.json';
import { cookies } from 'next/headers';
import { auth } from '@/lib/firebase-admin';
import LockedScreen from '@/app/components/locked-screen';
import SpotPageClient from './client';

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

export default async function SpotPage({ params }: { params: { id: string } }) {
  let initialSpot: Spot | null = null;
  const spotId = params.id;

  // 1. Try to load from static examples first
  if (spotId.startsWith('static-')) {
    initialSpot = staticSpots.find(s => s.id === spotId) || null;
  } else {
    // 2. If not static, fetch from Firestore using Admin SDK
    try {
      initialSpot = await getSpotAdmin(spotId);
    } catch (e) {
      console.error(`Failed to fetch spot ${spotId} from Firestore`, e);
      // Let it fall through, client will try to load from cache.
    }
  }

  // --- Auth Check (Server Side) ---
  let userRole: 'free' | 'pro' | 'admin' = 'free';
  try {
    const sessionCookie = cookies().get('__session')?.value;
    if (sessionCookie) {
      const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
      const userProfile = await getUserProfileAdmin(decodedToken.uid);
      if (userProfile) {
        userRole = userProfile.role;
      }
    }
  } catch (error) {
    console.log('User not logged in or session expired');
  }

  // If spot data couldn't be found on the server at all, render client with null.
  // The client will then try to load from offline cache.
  if (!initialSpot) {
      return <SpotPageClient spotId={spotId} initialSpot={null} userRole={userRole} />;
  }

  // Server-side check for locked content to avoid flash of content for free users.
  const isLocked = initialSpot.isPro && userRole === 'free';
  
  if (isLocked) {
    return <LockedScreen spot={initialSpot} />;
  }

  // Render the client component with the initial data.
  return <SpotPageClient spotId={spotId} initialSpot={initialSpot} userRole={userRole} />;
}
