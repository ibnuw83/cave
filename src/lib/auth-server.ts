
import 'server-only';

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { safeGetAdminApp } from '@/firebase/admin';
import type { UserProfile } from '@/lib/types';
import type { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Verifies the session cookie from a Next.js request and returns the decoded token.
 * @param req The NextRequest object.
 * @returns The decoded ID token or null if verification fails.
 */
async function verifySession(req: NextRequest): Promise<DecodedIdToken | null> {
    const admin = safeGetAdminApp();
    if (!admin) {
      console.warn('[Auth Server] Admin SDK is not available.');
      return null;
    }
  
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) {
      return null;
    }
  
    try {
      // Set checkRevoked to true to ensure the session is still valid.
      const decoded = await admin.auth.verifySessionCookie(sessionCookie, true);
      return decoded;
    } catch (err) {
      console.warn('[Auth Server] Failed to verify session cookie:', err);
      return null;
    }
}

/**
 * Retrieves the full UserProfile from Firestore based on a decoded token.
 * @param decodedToken The decoded Firebase ID token.
 * @returns The user's profile from Firestore or null if not found.
 */
async function getProfileFromToken(decodedToken: DecodedIdToken): Promise<UserProfile | null> {
    const admin = safeGetAdminApp();
    if (!admin) return null;

    try {
        const userDoc = await admin.db.collection('users').doc(decodedToken.uid).get();
        if (userDoc.exists) {
            return { id: userDoc.id, ...userDoc.data() } as UserProfile;
        }
        return null;
    } catch (error) {
        console.error(`[Auth Server] Failed to fetch profile for UID ${decodedToken.uid}:`, error);
        return null;
    }
}


/**
 * Gets the full user profile for the currently authenticated user from a server-side Next.js request.
 * This is the primary function to be used in API Routes.
 * @param req The NextRequest object.
 * @returns The user's profile object or null if not authenticated or not found.
 */
export async function getUserFromSession(req: NextRequest): Promise<UserProfile | null> {
    const decodedToken = await verifySession(req);
    if (!decodedToken) {
        return null;
    }
    return getProfileFromToken(decodedToken);
}
