
import { cookies } from 'next/headers';
import { auth } from '@/lib/firebase-admin';
import { getSpotAdmin, getUserProfileAdmin } from '@/lib/firebase-admin';
import SpotPageClient from './client';
import { Spot } from '@/lib/types';
import { getSpotClient } from '@/lib/firestore';


export default async function SpotPage({ params }: { params: { id: string } }) {
  const spotId = params.id;
  
  let initialSpot: Spot | null = null;
  // Attempt to fetch the spot on the server using the client SDK logic
  // This is more reliable as it doesn't depend on admin credentials for public data
  try {
    initialSpot = await getSpotClient(spotId);
  } catch(e) {
    console.log(`Server-side spot fetch for ${spotId} failed, will try on client.`);
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
    // User is not logged in or session has expired, 'userRole' remains 'free'.
    console.log('User not logged in or session expired');
  }

  // If spot is not found on server, client will try to fetch it or load from cache.
  return (
    <SpotPageClient
      spotId={spotId}
      initialSpot={initialSpot}
      userRole={userRole}
    />
  );
}

