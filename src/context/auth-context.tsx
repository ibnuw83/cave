
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut as firebaseSignOut, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { useAuth as useFirebaseAuthHook, useUser as useFirebaseUserHook, initializeFirebase } from '@/firebase'; // Renamed to avoid conflicts
import { UserProfile, RegisterData } from '@/lib/types';
import { getUserProfileClient, createUserProfile } from '@/lib/firestore';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (data: RegisterData) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: firebaseUser, isUserLoading: firebaseUserLoading } = useFirebaseUserHook();
  const auth = useFirebaseAuthHook(); // The hook to get the auth instance
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const handleAuthChange = useCallback(async (user: User | null) => {
    if (user) {
      // User is signed in, fetch or create their profile
      try {
        let profile = await getUserProfileClient(user.uid);
        if (!profile) {
          console.log('Creating new user profile for:', user.uid);
          profile = await createUserProfile(user);
        }
        setUserProfile(profile);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Gagal Memuat Profil',
          description: 'Ada masalah saat memuat atau membuat profil pengguna Anda.'
        });
        await firebaseSignOut(auth);
        setUserProfile(null);
      }
    } else {
      // User is signed out
      setUserProfile(null);
    }
    setLoading(false);
  }, [auth, toast]);


  useEffect(() => {
    // This effect combines the initial user loading state from the core firebase hook
    // with the profile loading state.
    if (firebaseUserLoading) {
      setLoading(true);
    } else {
       // If firebase user state has resolved, trigger our handler.
       handleAuthChange(firebaseUser);
    }
  }, [firebaseUser, firebaseUserLoading, handleAuthChange]);


  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      // The onAuthStateChanged listener will handle the result
      await signInWithPopup(auth, provider);
      router.push('/');
      toast({
        title: "Login Berhasil",
        description: "Selamat datang kembali!",
      });
    } catch (error: any) {
      console.error("Error signing in with Google: ", error);
      if (error.code !== 'auth/popup-closed-by-user') {
          toast({
            title: "Login Gagal",
            description: error.message || "Terjadi kesalahan saat mencoba login dengan Google.",
            variant: "destructive",
          });
      }
      setLoading(false);
    }
  };
  
  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle the rest
      router.push('/');
       toast({
        title: "Login Berhasil",
        description: "Selamat datang kembali!",
      });
    } catch (error: any) {
      console.error("Error signing in with email: ", error);
       toast({
        title: "Login Gagal",
        description: "Email atau password salah.",
        variant: "destructive",
      });
       setLoading(false); // Only set loading false on error
    }
  }

  const registerWithEmail = async (data: RegisterData) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(userCredential.user, { displayName: data.name });
      
      // The onAuthStateChanged listener will pick up the new user and handle profile creation
      
      router.push('/');
       toast({
        title: "Pendaftaran Berhasil",
        description: "Selamat datang di Penjelajah Gua!",
      });

    } catch (error: any) {
        // The permission error during profile creation is handled in createUserProfile
        if (error.code !== 'permission-denied') {
            toast({
                title: "Pendaftaran Gagal",
                description: error.code === 'auth/email-already-in-use' ? 'Email ini sudah terdaftar.' : 'Terjadi kesalahan saat pendaftaran.',
                variant: "destructive",
            });
        }
        setLoading(false);
    }
  }
  
  const sendPasswordResetEmail = async (email: string) => {
    try {
      await firebaseSendPasswordResetEmail(auth, email);
      toast({
        title: 'Email Reset Password Terkirim',
        description: 'Silakan periksa kotak masuk email Anda untuk instruksi lebih lanjut.',
      });
    } catch (error: any) {
      console.error("Error sending password reset email: ", error);
      toast({
        variant: 'destructive',
        title: 'Gagal Mengirim Email',
        description: 'Gagal mengirim email reset password. Pastikan email yang Anda masukkan benar.',
      });
    }
  };


  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will clear user and profile
      router.push('/login');
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
    <AuthContext.Provider value={{ user: firebaseUser, userProfile, loading, signInWithGoogle, signInWithEmail, registerWithEmail, sendPasswordResetEmail, signOut }}>
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
