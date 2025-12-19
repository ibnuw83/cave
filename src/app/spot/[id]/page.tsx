
import { cookies } from 'next/headers';
import { auth as adminAuth } from '@/lib/firebase-admin';
import { getUserProfileAdmin, getSpotAdmin } from '@/lib/firebase-admin';
import SpotPageClient from './client';
import { Spot } from '@/lib/types';
import { getSpots } from '@/lib/firestore';


export default async function SpotPage({ params }: { params: { id: string } }) {
  const spotId = params.id;
  
  let initialSpot: Spot | null = null;
  let allSpotsInCave: Spot[] = [];

  try {
    initialSpot = await getSpotAdmin(spotId);
  } catch(e) {
    console.error(`Server-side spot fetch for ${spotId} failed, will try on client.`);
  }

  if (initialSpot) {
    try {
        allSpotsInCave = await getSpots(initialSpot.caveId);
    } catch (e) {
        console.error(`Server-side sibling spot fetch for cave ${initialSpot.caveId} failed.`);
    }
  }


  let userRole: 'free' | 'pro' | 'admin' = 'free';
  try {
    const sessionCookie = cookies().get('__session')?.value;
    if (sessionCookie) {
      const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
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
      initialSpot={initialSpot}
      initialAllSpots={allSpotsInCave}
      userRole={userRole}
    />
  );
}
