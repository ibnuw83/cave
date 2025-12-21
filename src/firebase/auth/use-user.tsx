'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth, useFirestore } from '@/firebase/provider';
import { User, onAuthStateChanged } from 'firebase/auth';
import { UserProfile } from '@/lib/types';
import { getUserProfileClient, createUserProfile } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { Timestamp } from 'firebase/firestore';

export function useUser() {
    const auth = useAuth();
    const { toast } = useToast();

    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isUserLoading, setIsUserLoading] = useState(true);
    const [isProfileLoading, setIsProfileLoading] = useState(true);
    const [authError, setAuthError] = useState<Error | null>(null);

    const refreshUserProfile = useCallback(async () => {
        if (!user) return;
        setIsProfileLoading(true);
        try {
            const profile = await getUserProfileClient(user.uid);
            setUserProfile(profile);
        } catch (error) {
            console.error("Failed to refresh user profile:", error);
            toast({
                variant: "destructive",
                title: "Gagal menyegarkan profil",
            });
        } finally {
            setIsProfileLoading(false);
        }
    }, [user, toast]);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            setIsUserLoading(false);
            
            if (firebaseUser) {
                setIsProfileLoading(true);
                try {
                    let profile = await getUserProfileClient(firebaseUser.uid);

                    if (!profile) {
                         // This is a new user, create their profile in Firestore
                        try {
                            profile = await createUserProfile(firebaseUser);
                            toast({ title: "Selamat Datang!", description: "Akun Anda berhasil dibuat." });
                        } catch (creationError) {
                             console.error("Failed to create user profile:", creationError);
                             toast({
                                title: "Gagal Membuat Profil",
                                description: "Terjadi kesalahan saat menyiapkan akun Anda. Silakan coba login lagi.",
                                variant: "destructive"
                            });
                             // Log out the user if profile creation fails to prevent an inconsistent state
                            await auth.signOut();
                            setUser(null);
                            setUserProfile(null);
                            return;
                        }
                    }
                    setUserProfile(profile);
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    setAuthError(error as Error);
                    setUserProfile(null);
                } finally {
                    setIsProfileLoading(false);
                }
            } else {
                // User is signed out
                setUserProfile(null);
                setIsProfileLoading(false);
            }
        }, (error) => {
            console.error("Auth state change error:", error);
            setAuthError(error);
            setIsUserLoading(false);
            setIsProfileLoading(false);
            setUser(null);
            setUserProfile(null);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [auth, toast]);

    return { 
        user, 
        userProfile, 
        isUserLoading, 
        isProfileLoading, 
        authError,
        refreshUserProfile
    };
}
