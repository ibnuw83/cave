import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { safeGetAdminApp } from '@/firebase/admin';

export async function POST(req: NextRequest) {
  const services = safeGetAdminApp();
  if (!services) return NextResponse.json({ error: 'Konfigurasi server tidak tersedia.' }, { status: 500 });
  const { auth, db } = services;

  const authorization = req.headers.get('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    const idToken = authorization.split('Bearer ')[1];
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    try {
      // Verify token before creating a session cookie
      const decodedToken = await auth.verifyIdToken(idToken);
      
      // Get role from Firestore to set custom claim
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      const role = userDoc.data()?.role || 'free';
      
      // Set custom claim if it doesn't exist
      if (decodedToken.role !== role) {
        await auth.setCustomUserClaims(decodedToken.uid, { role: role });
      }

      const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
      cookies().set('__session', sessionCookie, { maxAge: expiresIn, httpOnly: true, secure: true, path: '/' });
      return NextResponse.json({ status: 'success' });
    } catch (error) {
      console.error('Failed to create session cookie:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 401 });
    }
  }

  return NextResponse.json({ error: 'No token provided' }, { status: 400 });
}
