
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithRedirect, 
  signOut as firebaseSignOut, 
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
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
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const processAuth = useCallback(async (user: User) => {
    setUser(user);
    try {
        let profile = await getUserProfileClient(user.uid);
        if (!profile) {
            console.log('Creating new user profile for:', user.uid);
            // createUserProfile is now non-blocking for UI, but we still need to
            // get the result for the initial session.
            profile = await createUserProfile(user);
        }
        setUserProfile(profile);
        return profile;
    } catch (error: any) {
        // The error is already handled by the emitter in getUserProfile/createUserProfile
        // Just sign out if profile fails to load/create
        toast({
          variant: 'destructive',
          title: 'Gagal Memuat Profil',
          description: 'Ada masalah saat memuat atau membuat profil pengguna Anda. Silakan coba lagi.'
        });
        await firebaseSignOut(auth);
        setUser(null);
        setUserProfile(null);
        return null;
    }
  }, [toast]);

  useEffect(() => {
    const handleRedirect = async () => {
        setLoading(true); // Start loading when checking for redirect
        try {
            const result = await getRedirectResult(auth);
            if (result) {
                await processAuth(result.user);
                toast({
                    title: "Login Berhasil",
                    description: "Selamat datang kembali!",
                });
                router.push('/');
            }
        } catch (error: any) {
             console.error("Auth redirect error", error);
             toast({
                title: "Login Gagal",
                description: "Terjadi kesalahan saat login.",
                variant: "destructive",
            });
        } finally {
            // Only set loading to false after redirect check is complete
            // The onAuthStateChanged will handle its own loading state.
             if (!auth.currentUser) {
                setLoading(false);
            }
        }
    }
    handleRedirect();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        // Only re-process if the user is different from the one in state
        if (!userProfile || user.uid !== userProfile.uid) {
           await processAuth(user);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [processAuth, userProfile, router, toast]);

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
      // The redirect will be handled by the useEffect above
    } catch (error: any) {
      console.error("Error signing in with Google: ", error);
      toast({
        title: "Login Gagal",
        description: error.message || "Terjadi kesalahan saat mencoba login.",
        variant: "destructive",
      });
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
      
      // reload user to get displayName, onAuthStateChanged will then pick it up
      await userCredential.user.reload();
      const updatedUser = auth.currentUser;

      if(updatedUser){
        await processAuth(updatedUser);
      }
      
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
    } finally {
        // Let onAuthStateChanged handle the final loading state
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
    <AuthContext.Provider value={{ user, userProfile, loading, signInWithGoogle, signInWithEmail, registerWithEmail, sendPasswordResetEmail, signOut }}>
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
