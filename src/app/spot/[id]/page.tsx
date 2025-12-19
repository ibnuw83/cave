
import { cookies } from 'next/headers';
import { auth } from '@/lib/firebase-admin';
import { getSpotAdmin, getUserProfileAdmin } from '@/lib/firebase-admin';
import SpotPageClient from './client';
import { Spot } from '@/lib/types';

export default async function SpotPage({ params }: { params: { id: string } }) {
  const spotId = params.id;
  
  // LOGIKA DIPERBAIKI: Selalu ambil data spot dari database.
  // Semua data statis dan logika 'if' yang membingungkan dihapus.
  const spot: Spot | null = await getSpotAdmin(spotId);

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
    // Pengguna tidak login atau sesi telah berakhir, 'userRole' tetap 'free'.
    console.log('User not logged in or session expired');
  }

  // Jika spot tidak ditemukan sama sekali baik di database, client akan menanganinya.
  return (
    <SpotPageClient
      spotId={spotId}
      initialSpot={spot}
      userRole={userRole}
    />
  );
}
