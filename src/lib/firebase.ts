
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

/* ==========================
   FIREBASE CONFIG
========================== */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

/* ==========================
   INIT APP (ANTI DUPLIKASI)
========================== */
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/* ==========================
   SERVICES
========================== */
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/* ==========================
   EMULATOR (OPTIONAL)
========================== */
// Gunakan variabel NEXT_PUBLIC_USE_EMULATOR di file .env.local Anda
if (process.env.NEXT_PUBLIC_USE_EMULATOR === 'true') {
  if (typeof window !== 'undefined') {
    console.log("Connecting to Firebase Emulators...");
    try {
        // Cek jika sudah terhubung untuk menghindari error Hot-Reload
        if (!(auth as any)._emulator) {
            connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        }
        if (!(db as any)._settings.host) {
            connectFirestoreEmulator(db, 'localhost', 8080);
        }
        if (!(storage as any)._emulator) {
            connectStorageEmulator(storage, 'localhost', 9199);
        }
    } catch (e) {
        console.error("Error connecting to emulators. Is it running?", e);
    }
  }
}

export default app;
