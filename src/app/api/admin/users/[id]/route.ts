
import { NextRequest, NextResponse } from 'next/server';
import { safeGetAdminApp } from '@/firebase/admin';
import { cookies } from 'next/headers';
import { deleteUserAdmin, updateUserStatusAdmin } from '@/lib/firestore-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

async function verifyAdmin(req: NextRequest): Promise<DecodedIdToken | null> {
    const admin = safeGetAdminApp();
    if (!admin) {
      console.warn('[ADMIN API] Admin SDK tidak tersedia');
      return null;
    }
  
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) {
      console.warn('[ADMIN API] Cookie sesi tidak ditemukan.');
      return null;
    }
  
    try {
      const decoded = await admin.auth.verifySessionCookie(sessionCookie, true);
      const userDoc = await admin.db.collection('users').doc(decoded.uid).get();
      if (userDoc.exists && userDoc.data()?.role === 'admin') {
        return decoded;
      }
      console.warn(`[ADMIN API] Verifikasi gagal: Pengguna ${decoded.uid} bukan admin.`);
      return null;
    } catch (err) {
      console.warn('[ADMIN API] Gagal verifikasi cookie admin:', err);
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
    
    // Guard to prevent admin from disabling their own account
    if (userId === adminUser.uid) {
      return NextResponse.json(
        { error: 'Admin tidak dapat menonaktifkan dirinya sendiri.' },
        { status: 400 }
      );
    }

    try {
        const body = await req.json();
        const { disabled } = body;

        if (typeof disabled !== 'boolean') {
            return NextResponse.json({ error: 'Properti `disabled` (boolean) diperlukan.' }, { status: 400 });
        }

        await updateUserStatusAdmin(userId, disabled);
        return NextResponse.json({ message: `Status pengguna berhasil diubah.` }, { status: 200 });

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

    // Guard to prevent admin from deleting their own account
    if (userId === adminUser.uid) {
      return NextResponse.json(
        { error: 'Admin tidak dapat menghapus dirinya sendiri.' },
        { status: 400 }
      );
    }

    try {
        await deleteUserAdmin(userId);
        return NextResponse.json({ message: 'Pengguna berhasil dihapus.' }, { status: 200 });
    } catch (error: any) {
        console.error(`[API] Gagal menghapus pengguna ${userId}:`, error);
        return NextResponse.json({ error: error.message || 'Gagal menghapus pengguna.' }, { status: 500 });
    }
}
