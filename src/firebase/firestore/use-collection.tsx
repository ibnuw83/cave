'use client';
import { useState, useEffect } from 'react';
import {
    onSnapshot,
    collection,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    endBefore,
    limitToLast,
    startAt,
    doc,
    getDoc,
    endAt,
    Query,
    DocumentData,
    FirestoreError,
    QuerySnapshot,
} from 'firebase/firestore';
import { useAuth, useFirestore } from '..';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';

export type CollectionHook<T> = {
    data: T[] | null;
    loading: boolean;
    error: FirestoreError | null;
};

export const useCollection = <T,>(
    q: Query<DocumentData> | null
): CollectionHook<T> => {
    const [data, setData] = useState<T[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<FirestoreError | null>(null);

    useEffect(() => {
        if (!q) {
            setLoading(false);
            return;
        };
        
        setLoading(true);

        const unsubscribe = onSnapshot(
            q,
            (snapshot: QuerySnapshot) => {
                const data: T[] = snapshot.docs.map(
                    (doc) => ({ id: doc.id, ...doc.data() } as unknown as T)
                );
                setData(data);
                setLoading(false);
            },
            (err: FirestoreError) => {
                if (err.code === 'permission-denied') {
                    const permissionError = new FirestorePermissionError({
                        path: (q as any)._query.path.segments.join('/'),
                        operation: 'list',
                    });
                    errorEmitter.emit('permission-error', permissionError);
                }
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [q]);

    return { data, loading, error };
};
