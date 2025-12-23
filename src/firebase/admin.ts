import * as admin from 'firebase-admin';

let adminApp: admin.app.App;

// This logic ensures we initialize the app only once.
if (!admin.apps.length) {
  adminApp = admin.initializeApp({
    // ADC (Application Default Credentials) will be used in App Hosting.
    credential: admin.credential.applicationDefault(),
  });
  console.log('[Firebase Admin] Initialized successfully.');
} else {
  // Use the already-initialized app.
  adminApp = admin.app();
}

// Export the initialized services directly.
// If initialization fails, the server will crash on startup, which is a clear signal of a config problem.
export const adminAuth = admin.auth(adminApp);
export const adminDb = admin.firestore(adminApp);
