
import * as admin from 'firebase-admin';

let adminApp: admin.app.App;

// Periksa apakah aplikasi Firebase dengan nama default sudah ada
if (!admin.apps.find(app => app?.name === '[DEFAULT]')) {
  adminApp = admin.initializeApp({
    // projectId diambil dari GOOGLE_CLOUD_PROJECT env var secara otomatis
    // atau bisa di-set manual jika perlu
    projectId: "cave-57567",
  });
} else {
  // Jika sudah ada, gunakan aplikasi yang ada
  adminApp = admin.app('[DEFAULT]');
}

export function safeGetAdminApp() {
  // Fungsi ini memastikan kita tidak menginisialisasi ulang
  // dan selalu mengembalikan SDK yang sudah siap.
  return {
    auth: admin.auth(adminApp),
    db: admin.firestore(adminApp),
  };
}
