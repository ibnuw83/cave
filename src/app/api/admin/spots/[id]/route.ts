import { NextRequest, NextResponse } from 'next/server';
import { safeGetAdminApp } from '@/firebase/admin';
import * as admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

async function verifyAdmin(req: NextRequest): Promise<DecodedIdToken | null> {
  const services = safeGetAdminApp();
  if (!services) return null;

  const { auth, db } = services;

  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return null;

  const idToken = authorization.replace('Bearer ', '');

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (userDoc.exists && userDoc.data()?.role === 'admin') {
      return decodedToken;
    }
    return null;
  } catch (err) {
    console.error('[verifyAdmin]', err);
    return null;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
        return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const services = safeGetAdminApp();
    if (!services) return NextResponse.json({ error: 'Admin SDK tidak tersedia.' }, { status: 500 });
    const { db } = services;

    try {
        const { id } = params;
        await db.collection('spots').doc(id).delete();
        return NextResponse.json({ message: `Spot ${id} berhasil dihapus.` });
    } catch (error: any) {
        console.error(`Error deleting spot ${params.id}:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
