'use client';

import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';
import { toast } from '@/hooks/use-toast';

// The listener is attached once when this module is imported.
// The EventEmitter uses a Set to prevent duplicate listeners.
errorEmitter.on((error: FirestorePermissionError) => {
  // Only handle FirestorePermissionError instances
  if (error instanceof FirestorePermissionError) {
    toast({
      variant: 'destructive',
      title: 'Akses Ditolak',
      description:
        'Anda tidak memiliki izin untuk melakukan tindakan ini.',
    });

    console.warn('[PERMISSION DENIED]', {
      path: error.context.path,
      operation: error.context.operation,
      data: error.context.requestResourceData,
    });
  }
});

/**
 * This function is kept for backwards compatibility in case it's called somewhere,
 * but the primary mechanism is now the module-level listener registration.
 */
export function initPermissionToast() {
  // The logic is now handled at the module level to be more robust
  // against hot-reloading and multiple initializations.
}
