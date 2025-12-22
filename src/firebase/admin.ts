
import * as admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;

// Sederhanakan inisialisasi. Jika belum ada aplikasi, buat.
if (!admin.apps.length) {
  try {
    adminApp = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (e) {
    console.error('Firebase Admin SDK initialization error:', e);
  }
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
        console.error("Firebase Admin SDK belum diinisialisasi dengan benar.");
        return null;
    }
    return {
        auth: admin.auth(adminApp),
        db: admin.firestore(adminApp),
    };
}
