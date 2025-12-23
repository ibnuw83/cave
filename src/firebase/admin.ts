
import * as admin from 'firebase-admin';
import { firebaseConfig } from './config';

// This logic ensures we initialize the app only once.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      // Providing a projectId explicitly tells the Admin SDK to connect
      // to the production project, overriding any emulator environment variables.
      credential: admin.credential.applicationDefault(),
      projectId: firebaseConfig.projectId,
    });
    console.log('[Firebase Admin] Initialized for production project:', firebaseConfig.projectId);
  } catch (error: any) {
    console.error('[Firebase Admin] CRITICAL: Failed to initialize Firebase Admin SDK.', error);
    // If admin fails to initialize, we should crash the server process
    // so it gets restarted and we are explicitly aware of the configuration issue.
    process.exit(1);
  }
}

export const adminApp = admin.app();
export const adminAuth = admin.auth(adminApp);
export const adminDb = admin.firestore(adminApp);
