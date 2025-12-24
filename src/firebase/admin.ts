
import * as admin from 'firebase-admin';

/**
 * Ensures that the Firebase Admin SDK is initialized only once.
 * This function is the single entry point for accessing the admin app instance.
 * @returns The initialized Firebase Admin App instance.
 */
export function safeGetAdminApp(): admin.app.App {
  // If the app is already initialized, return it.
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Otherwise, initialize the app.
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!projectId) {
      throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set in the environment variables.");
    }

    // In a Google Cloud environment (like App Hosting), initializing without arguments
    // automatically uses the project's service account credentials.
    admin.initializeApp();
    
    // Explicitly unset the emulator host environment variable after initialization.
    // This prevents accidental connections to an emulator in production.
    delete process.env.FIRESTORE_EMULATOR_HOST;

  } catch (error: any) {
    console.error('[Firebase Admin] CRITICAL: Failed to initialize Firebase Admin SDK.', error);
    // Crash the process if initialization fails, as it's a fatal configuration error.
    process.exit(1);
  }

  return admin.app();
}
