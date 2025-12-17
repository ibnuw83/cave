'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';
import { useToast } from '@/hooks/use-toast';

// This function is called from AuthProvider to set up the global error listener.
export function usePermissionErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      console.warn('[PERMISSION DENIED]', {
        path: error.context.path,
        operation: error.context.operation,
        data: error.context.requestResourceData,
      });

      toast({
        variant: 'destructive',
        title: 'Akses Ditolak',
        description: 'Anda tidak memiliki izin untuk melakukan tindakan ini.',
      });

      // NOTE: In a production app, you might want to log this to a service like Sentry.
      // For the development overlay to pick up the error, we can re-throw it.
      // This makes debugging much easier. We are choosing not to do this to avoid breaking the app flow.
      // if (process.env.NODE_ENV === 'development') {
      //    throw error;
      // }
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);
}
