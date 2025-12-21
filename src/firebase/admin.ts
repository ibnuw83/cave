
import * as admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;

if (!admin.apps.length) {
  adminApp = admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
} else {
  adminApp = admin.apps[0];
}

export function safeGetAdminApp() {
  return {
    auth: admin.auth(adminApp!),
    db: admin.firestore(adminApp!),
  };
}
