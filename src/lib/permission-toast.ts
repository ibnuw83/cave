'use client';

import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';
import { toast } from '@/hooks/use-toast';

let initialized = false;

export function initPermissionToast() {
  if (initialized) return;
  initialized = true;

  errorEmitter.on('permission-error', (error: FirestorePermissionError) => {
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
  });
}
