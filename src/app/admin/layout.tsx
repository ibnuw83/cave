'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AdminSidebar from './admin-sidebar';
import { useUser, useFirestore } from '@/firebase';
import { UserProfile } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';


export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading) return; // Wait until user auth state is resolved

    if (!user) {
      router.replace('/login');
      return;
    }

    setIsProfileLoading(true);
    const ref = doc(firestore, 'users', user.uid);
    getDoc(ref)
      .then(snap => {
        const profile = snap.exists() ? { id: snap.id, ...snap.data() } as UserProfile : null;
        setUserProfile(profile);

        if (profile?.role !== 'admin') {
          toast({
            variant: 'destructive',
            title: 'Akses Ditolak',
            description: 'Halaman ini khusus untuk admin.',
          });
          router.replace('/');
        }
      })
      .catch(error => {
        console.error("Failed to fetch user profile:", error);
        toast({
          variant: 'destructive',
          title: 'Gagal Memuat Profil',
          description: 'Tidak dapat memverifikasi peran pengguna.',
        });
        router.replace('/');
      })
      .finally(() => setIsProfileLoading(false));
  }, [user, isUserLoading, firestore, router, toast]);

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading || !userProfile || userProfile.role !== 'admin') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Memeriksa otorisasi...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="md:grid md:grid-cols-[250px_1fr]">
      <AdminSidebar user={user} userProfile={userProfile} />
      <main className="pb-24 pt-14 md:pt-0 md:pb-0">{children}</main>
    </div>
  );
}
