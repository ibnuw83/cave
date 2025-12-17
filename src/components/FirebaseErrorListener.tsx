'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      console.error(error); // This will show the detailed error in the dev console
      
      // We can also show a toast to the user
      toast({
        variant: 'destructive',
        title: 'Kesalahan Izin (Permissions Error)',
        description: 'Anda tidak memiliki izin untuk melakukan aksi ini. Periksa aturan keamanan Firebase Anda.',
      });

      // NOTE: In a production app, you might want to log this to a service like Sentry.
      // For the development overlay to pick up the error, we re-throw it.
      // This makes debugging much easier.
      if (process.env.NODE_ENV === 'development') {
         throw error;
      }
    };

    errorEmitter.on(handlePermissionError);

    return () => {
      errorEmitter.off(handlePermissionError);
    };
  }, [toast]);

  return null;
}
