
'use client';

// Export everything from the layout file now
export { useAuth, useFirestore, useFirebaseApp, useFirebase } from '@/app/layout';

// Export hooks and utilities
export * from './errors';
export * from './error-emitter';

// Keep use-user export for compatibility
export { useUser } from './auth/use-user';
