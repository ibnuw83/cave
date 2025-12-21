
import 'server-only';
import * as admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;
let initError: Error | null = null;

function initialize() {
  if (admin.apps.length > 0) {
    adminApp = admin.apps[0];
    return;
  }
  
  try {
    // This will work in production environments (App Hosting, Cloud Functions)
    adminApp = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log('[Firebase Admin] Initialized with Application Default Credentials.');
  } catch (e: any) {
    // This block will run in local development if ADC is not set up.
    console.warn(`[Firebase Admin] Failed to initialize with ADC: ${e.message}.`);
    console.log('[Firebase Admin] Attempting to connect to Firestore Emulator...');
    
    // Set a dummy project ID for the emulator
    process.env.GCLOUD_PROJECT = 'cave-57567';
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

    try {
      adminApp = admin.initializeApp({
        projectId: 'cave-57567',
      });
      console.log('[Firebase Admin] Successfully connected to Firestore Emulator.');
    } catch (emulatorError: any) {
      initError = emulatorError;
      console.error(`[Firebase Admin] Failed to connect to emulator: ${emulatorError.message}`);
    }
  }
}

// Initialize on module load
initialize();

/**
 * Attempts to safely get the Firebase Admin SDK services.
 * Returns null if the SDK failed to initialize, allowing the app
 * to run in a degraded mode rather than crashing.
 */
export function safeGetAdminApp() {
    if (initError || !adminApp) {
        if (initError) {
          // Log the initialization error only once if it exists
          console.warn(`[Firebase Admin] SDK not available due to initialization error: ${initError.message}`);
        }
        return null;
    }
    return {
        auth: admin.auth(adminApp),
        db: admin.firestore(adminApp),
    };
}
