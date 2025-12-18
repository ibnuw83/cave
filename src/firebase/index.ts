
import { FirebaseApp } from 'firebase/app';
import app, { db, auth as firebaseAuth } from '@/lib/firebase';

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


export const firestore = db;
export const auth = firebaseAuth;
export const firebaseApp: FirebaseApp = app;
