
import * as admin from 'firebase-admin';

// This logic ensures we initialize the app only once.
if (!admin.apps.length) {
  try {
    // In App Hosting, the SDK is automatically initialized with the correct
    // project configuration when no arguments are provided.
    admin.initializeApp();
    console.log('[Firebase Admin] Initialized successfully.');
  } catch (error: any) {
    console.error('[Firebase Admin] CRITICAL: Failed to initialize Firebase Admin SDK.', error);
    // If admin fails to initialize, crash the server process to be explicitly aware of the issue.
    // This is better than silent failures.
    process.exit(1);
  }
}

// Use getters to lazily initialize the services. This ensures that they are accessed
// only after the app has been initialized, avoiding potential race conditions.
export const adminApp = admin.app();
export const adminAuth = admin.auth(adminApp);
export const adminDb = admin.firestore(adminApp);
