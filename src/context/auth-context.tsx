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
    // Handle the redirect result from Google Sign-In
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          setLoading(true);
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
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Error getting redirect result: ", error);
        if (error.code === 'auth/unauthorized-domain') {
           toast({
            title: "Login Gagal",
            description: "Domain aplikasi tidak diizinkan. Mohon periksa konfigurasi Firebase Anda.",
            variant: "destructive",
          });
        }
      });

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        // Only fetch/create profile if it's not already loaded
        if (!userProfile || user.uid !== userProfile.uid) {
            let profile = await getUserProfile(user.uid);
            if (!profile) {
            profile = await createUserProfile(user);
            }
            setUserProfile(profile);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast, userProfile]);

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
      setUser(null);
      setUserProfile(null);
      toast({
        title: "Logout Berhasil",
        description: "Anda telah keluar dari akun.",
      });
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
