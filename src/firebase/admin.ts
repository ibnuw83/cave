import 'server-only';
import * as admin from 'firebase-admin';

export async function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return {
      auth: admin.auth(),
      db: admin.firestore(),
    };
  }

  const app = admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });

  return {
    auth: admin.auth(app),
    db: admin.firestore(app),
  };
}
