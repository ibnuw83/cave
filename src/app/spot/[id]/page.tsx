

import { cookies } from 'next/headers';
import { auth } from '@/lib/firebase-admin';
import { getSpotAdmin, getUserProfileAdmin } from '@/lib/firebase-admin';
import SpotPageClient from './client';
import { Spot } from '@/lib/types';
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
        viewType: 'panorama',
    },
    {
        id: 'static-spot-jomblang-mud',
        caveId: 'static-jomblang',
        order: 2,
        title: 'Jalur Berlumpur (PRO)',
        description: 'Tantangan jalur berlumpur sebelum mencapai dasar gua.',
        imageUrl: placeholderImages.find(p => p.id === 'spot-jomblang-mud')?.imageUrl || '',
        isPro: true,
        viewType: 'flat',
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
        viewType: 'panorama',
    },
    {
        id: 'static-spot-gong-pool',
        caveId: 'static-gong',
        order: 2,
        title: 'Kolam Bawah Tanah (PRO)',
        description: 'Kolam air jernih yang terbentuk secara alami di dalam gua.',
        imageUrl: placeholderImages.find(p => p.id === 'spot-gong-pool')?.imageUrl || '',
        isPro: true,
        viewType: 'flat',
    }
];


export default async function SpotPage({ params }: { params: { id: string } }) {
  let spot: Spot | null = null;
  const spotId = params.id;

  if (spotId.startsWith('static-')) {
    spot = staticSpots.find(s => s.id === spotId) || null;
  } else {
    spot = await getSpotAdmin(spotId);
  }

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

  return (
    <SpotPageClient
      spotId={spotId}
      initialSpot={spot}
      userRole={userRole}
    />
  );
}
