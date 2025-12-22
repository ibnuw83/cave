
import * as admin from 'firebase-admin';

let adminApp: admin.app.App;

if (!admin.apps.length) {
  adminApp = admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'cave-57567', // 🔥 INI KUNCI UTAMA
  });
} else {
  adminApp = admin.apps[0]!;
}

export function safeGetAdminApp() {
  return {
    auth: admin.auth(adminApp),
    db: admin.firestore(adminApp),
  };
}
