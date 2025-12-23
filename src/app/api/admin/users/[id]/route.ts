
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/firebase/admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Verifies if the request comes from an authenticated admin user.
 * @param req The NextRequest object.
 * @returns A promise that resolves to the admin's DecodedIdToken or null if not an admin.
 */
async function verifyAdmin(req: NextRequest): Promise<DecodedIdToken | null> {
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) {
      return null;
    }
  
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
      const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
      if (userDoc.exists && userDoc.data()?.role === 'admin') {
        return decoded;
      }
      return null;
    } catch (err) {
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

        await adminAuth.updateUser(userId, { disabled });
        await adminDb.collection('users').doc(userId).update({ disabled });
        
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
        const batch = adminDb.batch();
        batch.delete(adminDb.collection('users').doc(userId));
        await adminAuth.deleteUser(userId);
        await batch.commit();

        return NextResponse.json({ message: 'Pengguna berhasil dihapus.' });
    } catch (error: any) {
        console.error(`[API] Gagal menghapus pengguna ${userId}:`, error);
        return NextResponse.json({ error: error.message || 'Gagal menghapus pengguna.' }, { status: 500 });
    }
}
