
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Mountain, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { getKioskSettings } from '@/lib/firestore-client';
import { KioskSettings } from '@/lib/types';
import Image from 'next/image';
import { 
  signInWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
} from 'firebase/auth';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email({ message: 'Email tidak valid.' }),
  password: z.string().min(1, { message: 'Password tidak boleh kosong.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const auth = useAuth();
  const db = useFirestore();
  const { user, userProfile, isUserLoading, isProfileLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [settings, setSettings] = useState<KioskSettings | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // This effect handles redirection after a user's role is confirmed.
    if(!isUserLoading && !isProfileLoading && user && userProfile) {
        if (userProfile.role === 'admin') {
            router.push('/admin');
        } else {
            router.push('/');
        }
    }
  }, [user, userProfile, isUserLoading, isProfileLoading, router]);

  useEffect(() => {
    if (!db) return;
    getKioskSettings(db).then(setSettings);
  }, [db]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signInWithEmail = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      // Let the useUser hook and useEffect handle redirection.
      // Do not navigate manually here.
    } catch (error: any) {
       if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        toast({
            title: "Login Gagal",
            description: "Email atau password salah.",
            variant: "destructive",
          });
       } else {
           toast({
            title: "Login Gagal",
            description: "Terjadi kesalahan. Silakan coba lagi.",
            variant: "destructive",
          });
       }
       setIsSubmitting(false); // Only set submitting to false on error
    } 
    // Do not set isSubmitting to false on success, to prevent UI flicker before redirection.
  };
  
  const handleForgotPassword = () => {
    const email = form.getValues('email');
    if (!email || !z.string().email().safeParse(email).success) {
      form.setError('email', { type: 'manual', message: 'Masukkan email yang valid untuk reset password.' });
      return;
    }
    firebaseSendPasswordResetEmail(auth, email)
      .then(() => {
        toast({
          title: 'Email Reset Password Terkirim',
          description: 'Silakan periksa kotak masuk email Anda untuk instruksi lebih lanjut.',
        });
      })
      .catch(() => {
        toast({
          variant: 'destructive',
          title: 'Gagal Mengirim Email',
          description: 'Gagal mengirim email reset password. Pastikan email yang Anda masukkan benar.',
        });
      });
  };

  const isLoading = isSubmitting || isUserLoading || isProfileLoading;
  
  // If user object exists but profile is still loading, show a loader.
  // This prevents flashing the login page for an already logged-in user.
  if (isUserLoading || (user && isProfileLoading)) {
      return (
         <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )
  }

  // If after all loading, user exists, they are already logged in and being redirected by useEffect.
  // We show a loader here as well to cover the brief period before redirection happens.
  if(user && userProfile) {
      return (
         <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )
  }


  return (
    <div className="relative min-h-screen bg-background p-4">
        <div className="absolute top-4 left-4">
            <Button variant="ghost" asChild>
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Halaman Utama
                </Link>
            </Button>
        </div>

        <div className="flex min-h-screen items-center justify-center py-12">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                {settings?.logoUrl ? (
                    <Image src={settings.logoUrl} alt="App Logo" width={48} height={48} className="mx-auto h-12 w-12" />
                ) : (
                    <Mountain className="mx-auto h-12 w-12 text-primary" />
                )}
                <h1 className="mt-4 text-3xl font-bold font-headline">Selamat Datang</h1>
                <p className="mt-2 text-muted-foreground">Masuk untuk memulai petualangan.</p>
                </div>
                
                <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Lanjutkan dengan email</span>
                </div>
                </div>

                <Form {...form}>
                <form onSubmit={form.handleSubmit(signInWithEmail)} className="space-y-4">
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input placeholder="anda@email.com" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} disabled={isLoading}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="flex items-center justify-end">
                        <Button type="button" variant="link" className="p-0 h-auto text-xs" onClick={handleForgotPassword}>Lupa Password?</Button>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Masuk'}
                    </Button>
                </form>
                </Form>
                 <div className="text-center text-sm text-muted-foreground">
                    Belum punya akun?{' '}
                    <Link href="/register" className="font-semibold text-primary hover:underline">
                        Daftar di sini
                    </Link>
                </div>
            </div>
      </div>
    </div>
  );
}
