
import * as admin from 'firebase-admin';
import { firebaseConfig } from './config';

let adminApp: admin.app.App | null = null;

try {
  if (!admin.apps.length) {
    adminApp = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: firebaseConfig.projectId,
    });
    console.log('[Firebase Admin] Initialized');
  } else {
    adminApp = admin.app();
  }
} catch (err) {
  console.warn('[Firebase Admin] Not initialized (no credentials)');
  adminApp = null;
}

/**
 * Safe getter
 * ❗ auth & db BARU dibuat saat fungsi dipanggil
 */
export function safeGetAdminApp() {
  if (!adminApp) return null;

  return {
    auth: admin.auth(adminApp),
    db: admin.firestore(adminApp),
  };
}
