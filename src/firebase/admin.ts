
import * as admin from 'firebase-admin';

// Explicitly unset the emulator host environment variable.
// This is a robust way to ensure that in a production environment,
// the Admin SDK does NOT try to connect to a local emulator,
// even if the build environment had the variable set.
delete process.env.FIRESTORE_EMULATOR_HOST;

// This logic ensures we initialize the app only once.
if (!admin.apps.length) {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!projectId) {
      throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set in the environment variables.");
    }
    
    admin.initializeApp({
      projectId: projectId,
    });

  } catch (error: any) {
    console.error('[Firebase Admin] CRITICAL: Failed to initialize Firebase Admin SDK.', error);
    // This will cause the server to crash on startup if initialization fails,
    // making it obvious that there is a fundamental configuration issue.
    process.exit(1);
  }
}

export const adminApp = admin.app();
export const adminAuth = admin.auth(adminApp);
export const adminDb = admin.firestore(adminApp);
