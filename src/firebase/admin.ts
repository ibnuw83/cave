import * as admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;

// Sederhanakan inisialisasi. Jika belum ada aplikasi, buat.
if (!admin.apps.length) {
  adminApp = admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
} else {
  // Jika sudah ada, gunakan yang sudah ada.
  adminApp = admin.apps[0];
}

/**
 * Fungsi ini mengembalikan instance Auth dan Firestore dari Admin SDK yang sudah diinisialisasi.
 * Ini adalah cara yang aman dan andal untuk mendapatkan akses ke layanan backend.
 */
export function safeGetAdminApp() {
    if (!adminApp) {
        // Ini seharusnya tidak terjadi lagi dengan logika inisialisasi yang baru.
        throw new Error("Firebase Admin SDK belum diinisialisasi.");
    }
    return {
        auth: admin.auth(adminApp),
        db: admin.firestore(adminApp),
    };
}
