import * as admin from 'firebase-admin';
import { firebaseConfig } from './config';

let adminApp: admin.app.App;

// This logic ensures we initialize the app only once.
if (!admin.apps.length) {
  adminApp = admin.initializeApp({
    // ADC (Application Default Credentials) will be used in App Hosting.
    credential: admin.credential.applicationDefault(),
    databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
  });
  console.log('[Firebase Admin] Initialized successfully.');
} else {
  // Use the already-initialized app.
  adminApp = admin.app();
}

export const adminAuth = admin.auth(adminApp);
export const adminDb = admin.firestore(adminApp);
