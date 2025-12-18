
import * as admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else if (process.env.NODE_ENV === 'development') {
    // In development without a service account, use application default credentials.
    // This requires `gcloud auth application-default login` to be run.
    console.log('Initializing Firebase Admin SDK with Application Default Credentials...');
    admin.initializeApp();
  } else {
    // In production, rely on the environment automatically providing credentials.
    admin.initializeApp();
  }
}

export const auth = admin.auth();
export const db = admin.firestore();
