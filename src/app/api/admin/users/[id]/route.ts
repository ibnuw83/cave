
import { NextRequest, NextResponse } from 'next/server';
import { safeGetAdminApp } from '@/firebase/admin';
import { cookies } from 'next/headers';
import { deleteUserAdmin } from '@/lib/firestore-admin';

async function verifyAdmin(req: NextRequest): Promise<boolean> {
    const admin = safeGetAdminApp();
    if (!admin) return false;

    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) return false;

    try {
        const decodedIdToken = await admin.auth.verifySessionCookie(sessionCookie, true);
        const userDoc = await admin.db.collection('users').doc(decodedIdToken.uid).get();
        return userDoc.exists && userDoc.data()?.role === 'admin';
    } catch (error) {
        return false;
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
