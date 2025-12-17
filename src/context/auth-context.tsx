'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithRedirect, signOut as firebaseSignOut, getRedirectResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { UserProfile } from '@/lib/types';
import { getUserProfile, createUserProfile } from '@/lib/firestore';
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        let profile = await getUserProfile(user.uid);
        if (!profile) {
          profile = await createUserProfile(user);
        }
        setUserProfile(profile);
      } else {
        // Check for redirect result
        try {
          const result = await getRedirectResult(auth);
          if (result) {
            // This is the successfully redirected user.
            const user = result.user;
            setUser(user);
            let profile = await getUserProfile(user.uid);
            if (!profile) {
              profile = await createUserProfile(user);
            }
            setUserProfile(profile);
            toast({
              title: "Login Berhasil",
              description: "Selamat datang kembali!",
            });
          }
        } catch (error) {
           console.error("Error getting redirect result: ", error);
        } finally {
            setUser(null);
            setUserProfile(null);
        }
      }
      setLoading(false);
    });

    // Handle initial redirect result check
    getRedirectResult(auth).then(async (result) => {
        if (result) {
            const user = result.user;
            setUser(user);
            let profile = await getUserProfile(user.uid);
            if (!profile) {
              profile = await createUserProfile(user);
            }
            setUserProfile(profile);
             toast({
              title: "Login Berhasil",
              description: "Selamat datang kembali!",
            });
        }
        setLoading(false);
    }).catch(error => {
        console.error("Error on initial redirect check:", error);
        setLoading(false);
    });


    return () => unsubscribe();
  }, [toast]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      toast({
        title: "Login Gagal",
        description: "Terjadi kesalahan saat mencoba login.",
        variant: "destructive",
      });
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({
        title: "Logout Berhasil",
        description: "Anda telah keluar dari akun.",
      });
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({
        title: "Logout Gagal",
        description: "Terjadi kesalahan saat mencoba logout.",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
