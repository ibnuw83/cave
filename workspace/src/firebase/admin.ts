
import * as admin from 'firebase-admin';

// Ambil konfigurasi dari environment variables yang juga digunakan oleh klien
// Ini memastikan server dan klien menggunakan project yang sama.
const firebaseAdminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // Kita tidak perlu semua kunci di sini, projectId sudah cukup jika
  // environment App Hosting dikonfigurasi dengan benar.
  // Namun, kita tambahkan credential untuk keandalan.
  credential: admin.credential.applicationDefault(),
};


/**
 * Initializes the Firebase Admin SDK if it hasn't been already.
 * This is a safe way to ensure we only have one instance of the app.
 */
if (!admin.apps.length) {
  try {
    admin.initializeApp(firebaseAdminConfig);
    console.log('Firebase Admin SDK initialized successfully for project:', firebaseAdminConfig.projectId);
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error);
    // Throw error untuk membuat kegagalan menjadi jelas saat development.
    throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
  }
}

const adminApp = admin.app();

/**
 * A safe getter function to retrieve the initialized Admin SDK services.
 * This function will only be called after the module-level initialization
 * has already run.
 * 
 * @returns An object containing the Firestore and Auth services from the Admin SDK.
 */
export function safeGetAdminApp() {
    if (!adminApp) {
        // This should theoretically never be reached.
        throw new Error("Firebase Admin SDK was not initialized. Check server logs for errors.");
    }
    return {
        auth: admin.auth(adminApp),
        db: admin.firestore(adminApp),
    };
}
