import 'server-only';
import * as admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;
let initError: Error | null = null;

function initialize() {
  // Hindari inisialisasi ulang jika sudah ada
  if (admin.apps.length > 0) {
    adminApp = admin.apps[0];
    return;
  }
  
  try {
    // Ini akan berhasil di lingkungan server (App Hosting, Cloud Functions)
    // atau jika Application Default Credentials (ADC) sudah di-setup secara lokal.
     adminApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
     });
  } catch (e: any) {
    // Tangkap error jika inisialisasi gagal (misalnya, tidak ada kredensial)
    initError = e;
    console.warn(`[Firebase Admin] Inisialisasi gagal. Ini wajar dalam pengembangan lokal jika ADC tidak di-setup. Aplikasi akan berjalan dalam mode terdegradasi (data sisi server dinonaktifkan). Error: ${e.message}`);
  }
}

// Lakukan inisialisasi saat modul dimuat
initialize();

/**
 * Mengembalikan instance Firebase Admin SDK yang telah diinisialisasi.
 * Ini akan melempar error jika inisialisasi gagal.
 * Sebaiknya gunakan safeGetAdminApp untuk menghindari crash.
 */
export function getAdminApp() {
  if (initError) {
    throw new Error(`Firebase Admin SDK tidak terinisialisasi. Pastikan lingkungan server memiliki kredensial yang benar. Original error: ${initError.message}`);
  }
  if (!adminApp) {
      throw new Error('Firebase Admin SDK tidak tersedia. Aplikasi mungkin tidak terinisialisasi dengan benar.');
  }

  return {
    auth: admin.auth(adminApp),
    db: admin.firestore(adminApp),
  };
}


/**
 * Mencoba mendapatkan service Firebase Admin SDK dengan aman.
 * Mengembalikan null jika SDK gagal diinisialisasi, memungkinkan aplikasi
 * untuk berjalan dalam mode terdegradasi daripada crash.
 */
export function safeGetAdminApp() {
    if (initError || !adminApp) {
        return null;
    }
    return {
        auth: admin.auth(adminApp),
        db: admin.firestore(adminApp),
    }
}
