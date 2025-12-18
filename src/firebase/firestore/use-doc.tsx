'use client';
import { useState, useEffect } from 'react';
import {
    onSnapshot,
    doc,
    DocumentReference,
    DocumentData,
    FirestoreError,
    DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';

export type DocHook<T> = {
    data: T | null;
    loading: boolean;
    error: FirestoreError | null;
};

export const useDoc = <T,>(
    ref: DocumentReference<DocumentData> | null
): DocHook<T> => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<FirestoreError | null>(null);

    useEffect(() => {
        if (!ref) {
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsubscribe = onSnapshot(
            ref,
            (snapshot: DocumentSnapshot) => {
                if (snapshot.exists()) {
                    const docData = { id: snapshot.id, ...snapshot.data() } as unknown as T;
                    setData(docData);
                } else {
                    setData(null);
                }
                setLoading(false);
            },
            (err: FirestoreError) => {
                console.error("useDoc error:", err);
                if (err.code === 'permission-denied') {
                     const permissionError = new FirestorePermissionError({
                        path: ref.path,
                        operation: 'get',
                    });
                    errorEmitter.emit('permission-error', permissionError);
                }
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [ref]);

    return { data, loading, error };
};
