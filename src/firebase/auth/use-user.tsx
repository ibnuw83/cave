'use client';

import { useUserHook } from '@/firebase/provider';

// This hook is now a simple wrapper around the one from the provider
// to maintain a consistent API (`useUser`) if needed, but it could be
// removed in favor of directly using the hook from `provider.tsx`.
export const useUser = () => {
    const { user, isUserLoading, userError } = useUserHook();
    return { user, isUserLoading, userError };
};
