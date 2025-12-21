
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
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';

const registerSchema = z.object({
  displayName: z.string().min(2, { message: 'Nama harus memiliki minimal 2 karakter.' }),
  email: z.string().email({ message: 'Email tidak valid.' }),
  password: z.string().min(6, { message: 'Password harus memiliki minimal 6 karakter.' }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
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

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '', email: '', password: '' },
  });

  const signUpWithEmail = async (data: RegisterFormValues) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      // After creating the user, update their profile with the display name
      await updateProfile(userCredential.user, {
        displayName: data.displayName,
      });

      // Send email verification
      await sendEmailVerification(userCredential.user);
      
      // The onAuthStateChanged listener in FirebaseProvider will handle profile creation in Firestore and redirect.
      toast({
        title: 'Pendaftaran Berhasil',
        description: 'Silakan periksa email Anda untuk verifikasi.',
      });
    } catch (error: any) {
       if (error.code === 'auth/email-already-in-use') {
        toast({
            title: "Pendaftaran Gagal",
            description: "Email ini sudah terdaftar. Silakan login.",
            variant: "destructive",
          });
       } else {
           toast({
            title: "Pendaftaran Gagal",
            description: "Terjadi kesalahan. Silakan coba lagi.",
            variant: "destructive",
          });
       }
    }
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
                <h1 className="mt-4 text-3xl font-bold font-headline">Buat Akun</h1>
                <p className="mt-2 text-muted-foreground">Daftar untuk memulai petualangan baru.</p>
                </div>
                
                <Form {...form}>
                <form onSubmit={form.handleSubmit(signUpWithEmail)} className="space-y-4">
                    <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nama Tampilan</FormLabel>
                        <FormControl>
                            <Input placeholder="Nama Anda" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
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
                    <Button type="submit" className="w-full" disabled={isUserLoading || isSubmitting}>
                    {isSubmitting || isUserLoading ? <Loader2 className="animate-spin" /> : 'Daftar'}
                    </Button>
                </form>
                </Form>
                 <div className="text-center text-sm text-muted-foreground">
                    Sudah punya akun?{' '}
                    <Link href="/login" className="font-semibold text-primary hover:underline">
                        Masuk di sini
                    </Link>
                </div>
            </div>
      </div>
    </div>
  );
}
