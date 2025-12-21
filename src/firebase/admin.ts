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
    // This will succeed in a deployed environment (App Hosting, Cloud Functions, etc.)
    // or if Application Default Credentials are set up locally.
     adminApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
     });
  } catch (e: any) {
    initError = e;
    console.warn(`[Firebase Admin] Initialization failed. This is expected in local development if ADC is not set up. App will run in a degraded mode where server-side data fetching is disabled. Error: ${e.message}`);
  }
}

// Initialize on module load
initialize();

/**
 * Returns the initialized Firebase Admin SDK services (auth, db).
 * Throws an error if initialization failed. This is the intended behavior
 * for functions that absolutely require the Admin SDK to operate.
 */
export function getAdminApp() {
  if (initError) {
    // Re-throw the original initialization error to make it clear why it's failing.
    throw new Error(`Firebase Admin SDK not initialized. Please ensure your server environment has the correct credentials. Original error: ${initError.message}`);
  }
  if (!adminApp) {
      throw new Error('Firebase Admin SDK is not available. The app may not have been initialized correctly.');
  }

  return {
    auth: admin.auth(adminApp),
    db: admin.firestore(adminApp),
  };
}


/**
 * Safely attempts to get the Firebase Admin SDK services.
 * Returns null if the SDK failed to initialize, allowing the app
 * to continue in a degraded state instead of crashing.
 */
export function safeGetAdminApp() {
    if (initError || !adminApp) {
        return null;
    }
    return {
        auth: admin.auth(adminApp),
        db: admin.firestore(adminApp),
    }
}
