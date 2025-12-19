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
import { getKioskSettings } from '@/lib/firestore';
import { KioskSettings } from '@/lib/types';
import Image from 'next/image';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
} from 'firebase/auth';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email({ message: 'Email tidak valid.' }),
  password: z.string().min(1, { message: 'Password tidak boleh kosong.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.901,36.626,44,30.638,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
      </svg>
    );
}

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [settings, setSettings] = useState<KioskSettings | null>(null);

  useEffect(() => {
    if(!isUserLoading && user) {
        router.push('/');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    getKioskSettings().then(setSettings);
  }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signInWithEmail = async (data: LoginFormValues) => {
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      // The onAuthStateChanged listener in FirebaseProvider will handle the redirect and profile logic
    } catch (error: any) {
       if (error.code === 'auth/invalid-credential') {
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
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // The onAuthStateChanged listener in FirebaseProvider will handle the redirect and profile logic
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
          toast({
            title: "Login Gagal",
            description: error.message || "Terjadi kesalahan saat mencoba login dengan Google.",
            variant: "destructive",
          });
      }
    }
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

  const isSubmitting = form.formState.isSubmitting;

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

                <Button variant="outline" className="w-full" onClick={signInWithGoogle} disabled={isUserLoading || isSubmitting}>
                    {isUserLoading ? <Loader2 className="animate-spin" /> : <><GoogleIcon className="mr-2"/> Lanjutkan dengan Google</>}
                </Button>
                
                <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Atau lanjutkan dengan email</span>
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
                            <Input placeholder="anda@email.com" {...field} />
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
                            <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="flex items-center justify-end">
                        <Button type="button" variant="link" className="p-0 h-auto text-xs" onClick={handleForgotPassword}>Lupa Password?</Button>
                    </div>
                    <Button type="submit" className="w-full" disabled={isUserLoading || isSubmitting}>
                    {isSubmitting || isUserLoading ? <Loader2 className="animate-spin" /> : 'Masuk'}
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
