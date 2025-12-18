import {
    getAuth,
    getFirestore,
    connectAuthEmulator,
    connectFirestoreEmulator,
} from 'firebase/auth';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';

// This import is needed to initialize the permission error listener
import '@/lib/permission-toast';

// Re-export hooks for easy access
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useUser } from './auth/use-user';
export { 
    useFirebase,
    useFirebaseApp,
    useFirestore,
    useAuth,
    FirebaseProvider,
    FirebaseClientProvider
} from './provider';


let app: FirebaseApp;
const appName = 'default';

try {
    app = getApp(appName);
} catch (e) {
    const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    app = initializeApp(firebaseConfig, appName);
}

export const firestore = getFirestore(app);
export const auth = getAuth(app);
export const firebaseApp = app;

if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // console.log('Connecting to Firebase Emulators');
    // try {
    //     connectFirestoreEmulator(firestore, 'localhost', 8080);
    //     connectAuthEmulator(auth, 'http://localhost:9099');
    // } catch(e) {
    //     console.error('Error connecting to emulators', e)
    // }
}
