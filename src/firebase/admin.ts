
import * as admin from 'firebase-admin';
import { firebaseConfig } from './config';

let adminApp: admin.app.App;

// This logic ensures that the admin app is initialized only once.
if (!admin.apps.length) {
  // In a Google Cloud environment (like App Hosting), the SDK automatically
  // finds the service account credentials.
  adminApp = admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: firebaseConfig.projectId,
  });
} else {
  // If already initialized, get the default app.
  adminApp = admin.app();
}

const adminAuth = admin.auth(adminApp);
const adminDb = admin.firestore(adminApp);

/**
 * Provides a safe way to get the initialized Firebase Admin SDK instances.
 * This prevents re-initialization and ensures services are ready.
 */
export function safeGetAdminApp() {
  return {
    auth: adminAuth,
    db: adminDb,
  };
}
