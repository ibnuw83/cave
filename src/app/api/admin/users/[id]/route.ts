
import { NextRequest, NextResponse } from 'next/server';
import { safeGetAdminApp } from '@/firebase/admin';
import { cookies } from 'next/headers';
import { deleteUserAdmin, updateUserStatusAdmin } from '@/lib/firestore-admin';

async function verifyAdmin(req: NextRequest): Promise<boolean> {
    const admin = safeGetAdminApp();
    if (!admin) {
        console.warn('[ADMIN API] Firebase Admin SDK not initialized. This is expected in local dev without ADC. Admin operations will be denied.');
        return false;
    }

    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) return false;

    try {
        const decodedIdToken = await admin.auth.verifySessionCookie(sessionCookie, true);
        const userDoc = await admin.db.collection('users').doc(decodedIdToken.uid).get();
        return userDoc.exists && userDoc.data()?.role === 'admin';
    } catch (error) {
        return false;
    }
}

// Handler for PUT /api/admin/users/[id] to update user status
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) {
        return NextResponse.json({ error: 'Akses ditolak: Hanya admin yang diizinkan.' }, { status: 403 });
    }

    const userId = params.id;
    if (!userId) {
        return NextResponse.json({ error: 'User ID diperlukan.' }, { status: 400 });
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
    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) {
        return NextResponse.json({ error: 'Akses ditolak: Hanya admin yang diizinkan.' }, { status: 403 });
    }

    const userId = params.id;
    if (!userId) {
        return NextResponse.json({ error: 'User ID diperlukan.' }, { status: 400 });
    }

    try {
        await deleteUserAdmin(userId);
        return NextResponse.json({ message: 'Pengguna berhasil dihapus.' }, { status: 200 });
    } catch (error: any) {
        console.error(`[API] Gagal menghapus pengguna ${userId}:`, error);
        return NextResponse.json({ error: error.message || 'Gagal menghapus pengguna.' }, { status: 500 });
    }
}
