
import * as admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;
let initError: Error | null = null;

function initialize() {
  if (admin.apps.length > 0) {
    adminApp = admin.apps[0];
    return;
  }
  
  // Explicitly use emulator for development, and application default for production.
  // This is a more robust way to handle different environments.
  if (process.env.NODE_ENV === 'development') {
    console.log('[Firebase Admin] Development mode detected, connecting to emulator...');
    try {
        process.env.GCLOUD_PROJECT = 'cave-57567';
        process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
        adminApp = admin.initializeApp({
            projectId: 'cave-57567',
        });
        console.log('[Firebase Admin] Successfully connected to Firestore Emulator.');
    } catch(e: any) {
        initError = e;
        console.error(`[Firebase Admin] CRITICAL: Failed to connect to emulator: ${e.message}`);
    }
  } else {
    // Production environment (App Hosting, etc.)
     console.log('[Firebase Admin] Production mode detected, initializing with Application Default Credentials...');
    try {
        adminApp = admin.initializeApp({
            credential: admin.credential.applicationDefault(),
        });
        console.log('[Firebase Admin] Initialized with Application Default Credentials.');
    } catch (e: any) {
        initError = e;
        console.error(`[Firebase Admin] CRITICAL: Failed to initialize with ADC: ${e.message}.`);
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
