
import 'server-only';

import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '../admin';
import { UserProfile } from '@/lib/types';
import { DecodedIdToken } from 'firebase-admin/auth';
import { UserRecord } from 'firebase-admin/auth';

interface UseUserReturn {
    user: UserRecord | null;
    userProfile: UserProfile | null;
}

/**
 * Server-side hook to get the current user and their profile.
 * Reads the session cookie and uses the Firebase Admin SDK.
 */
export const useUser = async (): Promise<UseUserReturn> => {
  const sessionCookie = cookies().get('__session')?.value;

  if (!sessionCookie) {
    return { user: null, userProfile: null };
  }

  try {
    const decodedIdToken: DecodedIdToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const user: UserRecord = await adminAuth.getUser(decodedIdToken.uid);

    const profileRef = adminDb.collection('users').doc(user.uid);
    const profileSnap = await profileRef.get();

    if (!profileSnap.exists) {
      console.warn(`[useUser Server] User profile not found for UID: ${user.uid}`);
      return { user, userProfile: null };
    }

    const userProfile = { id: profileSnap.id, ...profileSnap.data() } as UserProfile;

    return { user, userProfile };
  } catch (error) {
    // Session cookie is invalid or expired.
    console.warn('[useUser Server] Error verifying session cookie:', error);
    return { user: null, userProfile: null };
  }
};
