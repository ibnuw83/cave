
import * as admin from 'firebase-admin';

let services: { auth: admin.auth.Auth; db: admin.firestore.Firestore; } | null = null;

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

/**
 * Ensures that the Firebase Admin SDK is initialized only once and returns auth/db services.
 * This function is the single entry point for accessing the admin services.
 * @returns An object containing the initialized auth and firestore services, or null on failure.
 */
export function safeGetAdminApp(): { auth: admin.auth.Auth; db: admin.firestore.Firestore } | null {
  if (services) {
    return services;
  }

  // If the app is already initialized, get services from it.
  if (admin.apps.length > 0) {
    const app = admin.app();
    services = { auth: admin.auth(app), db: admin.firestore(app) };
    return services;
  }

  // Otherwise, initialize the app.
  try {
    if (!serviceAccount) {
      console.warn('[Firebase Admin] Service account key is not set. Admin features will be unavailable.');
      return null;
    }
    
    // In a Google Cloud environment (like App Hosting), initializing without arguments
    // automatically uses the project's service account credentials.
    // For local dev or other deployment environments (Vercel, Netlify), it needs the service account key.
    const app = admin.initializeApp(
        { credential: admin.credential.cert(serviceAccount) }
    );
    
    services = { auth: admin.auth(app), db: admin.firestore(app) };
    return services;

  } catch (error: any) {
    console.error('[Firebase Admin] CRITICAL: Failed to initialize Firebase Admin SDK.', error);
    // Don't crash the process, just return null so callers can handle it.
    return null;
  }
}
