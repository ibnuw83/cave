'use client';

// Export everything from the central provider
export * from './provider';

// Export hooks and utilities
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';

// Keep use-user export for compatibility
export { useUser } from './auth/use-user';
