
import * as admin from 'firebase-admin';
import { getApps, App, initializeApp } from 'firebase-admin/app';

// This interface is a subset of the service account JSON file.
interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

/**
 * Securely parses the service account key from environment variables.
 * @returns The parsed service account object or null if the variable is not set.
 */
function getServiceAccount(): ServiceAccount | null {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountJson) {
    console.warn(
      'FIREBASE_SERVICE_ACCOUNT_KEY is not set. Admin operations will fail.'
    );
    return null;
  }
  try {
    return JSON.parse(serviceAccountJson);
  } catch (e) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e);
    return null;
  }
}

/**
 * Initializes the Firebase Admin SDK on the server-side if it hasn't been already.
 * This is a safe function to call multiple times. It ensures only one app instance exists.
 * @returns An object containing the admin app, auth, and db services, or null if initialization fails.
 */
export function safeGetAdminApp() {
  const serviceAccount = getServiceAccount();
  if (!serviceAccount) {
    return null;
  }

  const apps = getApps();
  const app =
    apps.find((a) => a.name === serviceAccount.project_id) ||
    initializeApp(
      {
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      },
      serviceAccount.project_id
    );

  return {
    app,
    auth: admin.auth(app),
    db: admin.firestore(app),
  };
}
