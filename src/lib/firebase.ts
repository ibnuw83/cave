
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

/* ==========================
   FIREBASE CONFIG
========================== */
const firebaseConfig = {
  apiKey: "AIzaSyAr40uWMHG9Wdqa5D13K_jAKc_gIy4Jrg8",
  authDomain: "cave-57567.firebaseapp.com",
  projectId: "cave-57567",
  storageBucket: "cave-57567.appspot.com",
  messagingSenderId: "862428789556",
  appId: "1:862428789556:web:0941e0856737894942c361",
  measurementId: "G-7DTNV0C4ZV"
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
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_EMULATOR === 'true') {
  console.log("Connecting to Firebase Emulators...");
  try {
      // Cek jika sudah terhubung untuk menghindari error Hot-Reload
      if (!(auth as any)._emulator) {
          connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      }
      if (!(db as any)._settings.host || (db as any)._settings.host === 'firestore.googleapis.com') {
          connectFirestoreEmulator(db, 'localhost', 8080);
      }
      if (!(storage as any)._emulator) {
          connectStorageEmulator(storage, 'localhost', 9199);
      }
  } catch (e) {
      console.error("Error connecting to emulators. Is it running?", e);
  }
}

export default app;
