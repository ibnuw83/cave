'use client';

import { useUser as useFirebaseUserHook } from '@/firebase/provider'; // Use the main provider hook

// This hook is now a simple wrapper around the one from the provider
// to maintain a consistent API (`useUser`) if needed, but it could be
// removed in favor of directly using the hook from `provider.tsx`.
export const useUser = () => {
    const { user, isUserLoading, userError } = useFirebaseUserHook();
    return { user, isUserLoading, userError };
};
