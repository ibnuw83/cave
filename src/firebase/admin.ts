
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
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!projectId) {
      throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set in the environment variables.");
    }
    
    // In a Google Cloud environment (like App Hosting), initializing without arguments
    // automatically uses the project's service account credentials.
    // For local dev, it needs the service account key.
    const app = admin.initializeApp(
        serviceAccount ? { credential: admin.credential.cert(serviceAccount) } : {}
    );
    
    services = { auth: admin.auth(app), db: admin.firestore(app) };
    return services;

  } catch (error: any) {
    console.error('[Firebase Admin] CRITICAL: Failed to initialize Firebase Admin SDK.', error);
    // Don't crash the process, just return null so callers can handle it.
    return null;
  }
}
