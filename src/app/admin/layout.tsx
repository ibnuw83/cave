'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AdminSidebar from './admin-sidebar';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { UserProfile } from '@/lib/types';
import { doc } from 'firebase/firestore';


export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const loading = isUserLoading || isProfileLoading;

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }
    
    if (userProfile && userProfile.role !== 'admin') {
      toast({
        variant: 'destructive',
        title: 'Akses Ditolak',
        description: 'Halaman ini khusus untuk admin.',
      });
      router.replace('/');
    } else if (user && !userProfile && !isProfileLoading) {
        // This can happen briefly while the profile is being created.
        // If it persists, it's an issue.
        console.warn("User is logged in, but profile data is not yet available.");
    }

  }, [user, userProfile, loading, router, toast, isProfileLoading]);

  if (loading || !userProfile || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Memeriksa otorisasi...</p>
        </div>
      </div>
    );
  }

  if (userProfile.role !== 'admin') return null;

  return (
    <div className="md:grid md:grid-cols-[250px_1fr]">
      <AdminSidebar user={user} userProfile={userProfile} />
      <main className="pb-24 pt-14 md:pt-0 md:pb-0">{children}</main>
    </div>
  );
}
