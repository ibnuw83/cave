import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { safeGetAdminApp } from '@/firebase/admin';
import * as admin from 'firebase-admin';

const adminApp = safeGetAdminApp();
const adminAuth = admin.auth(adminApp);

export async function POST(req: NextRequest) {
  const authorization = req.headers.get('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    const idToken = authorization.split('Bearer ')[1];
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    try {
      const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
      cookies().set('__session', sessionCookie, { maxAge: expiresIn, httpOnly: true, secure: true });
      return NextResponse.json({ status: 'success' });
    } catch (error) {
      console.error('Failed to create session cookie:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 401 });
    }
  }

  return NextResponse.json({ error: 'No token provided' }, { status: 400 });
}
