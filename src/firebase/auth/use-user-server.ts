
import 'server-only';

import { cookies } from 'next/headers';
import { safeGetAdminApp } from '../admin';
import { UserProfile } from '@/lib/types';
import { getDoc } from 'firebase-admin/firestore';

/**
 * Server-side hook to get the current user and their profile.
 * Reads the session cookie and uses the Firebase Admin SDK.
 */
export const useUser = async () => {
  const admin = safeGetAdminApp();
  if (!admin) {
      console.warn('[useUser Server] Admin SDK not available.');
      return { user: null, userProfile: null };
  }
  const { auth, db } = admin;
  
  const sessionCookie = cookies().get('__session')?.value;

  if (!sessionCookie) {
    return { user: null, userProfile: null };
  }

  try {
    const decodedIdToken = await auth.verifySessionCookie(sessionCookie, true);
    const user = await auth.getUser(decodedIdToken.uid);

    const profileRef = db.collection('users').doc(user.uid);
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
