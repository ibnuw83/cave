
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/firebase/admin';
import type { UserProfile } from '@/lib/types';
import type { User } from 'firebase-admin/auth';

/**
 * Server-side utility to get the currently authenticated user and their profile.
 * This is NOT a React hook.
 * It reads the session cookie and uses the Admin SDK to verify it.
 *
 * @returns {Promise<{ user: User | null; userProfile: UserProfile | null }>}
 * An object containing the Firebase Admin user record and the Firestore user profile.
 */
export async function useUser() {
  const sessionCookie = cookies().get('__session')?.value;

  if (!sessionCookie) {
    return { user: null, userProfile: null };
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const user = await adminAuth.getUser(decodedToken.uid);
    
    const userDocRef = adminDb.collection('users').doc(decodedToken.uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      // This case is unlikely if auth is handled correctly, but good to have.
      return { user: user, userProfile: null };
    }

    const userProfile = { id: userDoc.id, ...userDoc.data() } as UserProfile;

    return { user, userProfile };
  } catch (error) {
    // Session cookie is invalid or expired.
    // console.error('Error verifying session cookie:', error);
    return { user: null, userProfile: null };
  }
}
