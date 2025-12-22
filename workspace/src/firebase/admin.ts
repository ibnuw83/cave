
import * as admin from 'firebase-admin';

let adminApp: admin.app.App;

/**
 * Initializes the Firebase Admin SDK if it hasn't been already.
 * This is a safe way to ensure we only have one instance of the app.
 */
function initializeAdminApp() {
  if (!admin.apps.length) {
    try {
      adminApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } catch (error: any) {
      console.error('Firebase Admin SDK initialization error:', error);
      // We are throwing here to make the failure explicit.
      // A missing GOOGLE_APPLICATION_CREDENTIALS env var is a common cause.
      throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
    }
  } else {
    adminApp = admin.app(); // Use the already initialized app
  }
}

// Immediately initialize the app when this module is loaded on the server.
initializeAdminApp();

/**
 * A safe getter function to retrieve the initialized Admin SDK services.
 * This function will only be called after the module-level initialization
 * has already run, so `adminApp` is guaranteed to be defined.
 * 
 * @returns An object containing the Firestore and Auth services from the Admin SDK.
 */
export function safeGetAdminApp() {
    if (!adminApp) {
        // This should theoretically never be reached due to the top-level call,
        // but it's a good safeguard.
        throw new Error("Firebase Admin SDK was not initialized. Check server logs for errors.");
    }
    return {
        auth: admin.auth(adminApp),
        db: admin.firestore(adminApp),
    };
}
