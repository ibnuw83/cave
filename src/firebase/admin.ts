
import * as admin from 'firebase-admin';

let adminApp: admin.app.App;

// Periksa apakah aplikasi Firebase dengan nama default sudah ada
if (!admin.apps.length) {
  adminApp = admin.initializeApp({
    // Gunakan kredensial default aplikasi yang disediakan oleh lingkungan Google Cloud
    credential: admin.credential.applicationDefault(),
    // Pastikan projectId sesuai dengan proyek Anda
    projectId: 'cave-57567',
  });
} else {
  // Jika sudah ada, gunakan aplikasi yang ada
  adminApp = admin.app();
}

/**
 * Provides a safe way to get the initialized Firebase Admin SDK instances.
 * This prevents re-initialization and ensures services are ready.
 */
export function safeGetAdminApp() {
  return {
    auth: admin.auth(adminApp),
    db: admin.firestore(adminApp),
  };
}
