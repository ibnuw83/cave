import { NextRequest, NextResponse } from 'next/server';
import { safeGetAdminApp } from '@/firebase/admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Verifies if the request comes from an authenticated admin user.
 * @param req The NextRequest object.
 * @returns A promise that resolves to the admin's DecodedIdToken or null if not an admin.
 */
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

// Handler for PUT /api/admin/users/[id] to update user status
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
        return NextResponse.json({ error: 'Akses ditolak: Hanya admin yang diizinkan.' }, { status: 403 });
    }
    
    const services = safeGetAdminApp();
    if (!services) return NextResponse.json({ error: 'Admin SDK tidak tersedia.' }, { status: 500 });
    const { auth, db } = services;

    const userId = params.id;
    if (!userId) {
        return NextResponse.json({ error: 'User ID diperlukan.' }, { status: 400 });
    }
    
    if (userId === adminUser.uid) {
      return NextResponse.json(
        { error: 'Admin tidak dapat mengubah status dirinya sendiri.' },
        { status: 400 }
      );
    }

    try {
        const body = await req.json();
        const { disabled } = body;

        if (typeof disabled !== 'boolean') {
            return NextResponse.json({ error: 'Properti `disabled` (boolean) diperlukan.' }, { status: 400 });
        }

        // Update both Auth and Firestore
        await auth.updateUser(userId, { disabled });
        await db.collection('users').doc(userId).update({ disabled });
        
        return NextResponse.json({ message: `Status pengguna berhasil diubah.` });

    } catch (error: any) {
        console.error(`[API] Gagal mengubah status pengguna ${userId}:`, error);
        return NextResponse.json({ error: error.message || 'Gagal mengubah status pengguna.' }, { status: 500 });
    }
}


// Handler for DELETE /api/admin/users/[id]
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
        return NextResponse.json({ error: 'Akses ditolak: Hanya admin yang diizinkan.' }, { status: 403 });
    }
    
    const services = safeGetAdminApp();
    if (!services) return NextResponse.json({ error: 'Admin SDK tidak tersedia.' }, { status: 500 });
    const { auth, db } = services;

    const userId = params.id;
    if (!userId) {
        return NextResponse.json({ error: 'User ID diperlukan.' }, { status: 400 });
    }

    if (userId === adminUser.uid) {
      return NextResponse.json(
        { error: 'Admin tidak dapat menghapus dirinya sendiri.' },
        { status: 400 }
      );
    }

    try {
        // It's safer to delete Auth user first. If this fails, we don't proceed.
        await auth.deleteUser(userId);
        // Then delete the Firestore document.
        await db.collection('users').doc(userId).delete();

        return NextResponse.json({ message: 'Pengguna berhasil dihapus.' });
    } catch (error: any) {
        console.error(`[API] Gagal menghapus pengguna ${userId}:`, error);
        // If user was deleted from Auth but Firestore failed, we might have an orphan document.
        // For this app, we accept this risk. For a production app, you might want more complex recovery logic.
        return NextResponse.json({ error: error.message || 'Gagal menghapus pengguna.' }, { status: 500 });
    }
}
