'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AdminSidebar from './admin-sidebar';
import { useUser } from '@/firebase';
import { UserProfile } from '@/lib/types';
import { User } from 'firebase/auth';


export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, userProfile, isUserLoading, isProfileLoading } = useUser();

  useEffect(() => {
    // Wait until both user and profile loading states are resolved
    if (isUserLoading || isProfileLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }
    
    if (userProfile?.role !== 'admin') {
      toast({
        variant: 'destructive',
        title: 'Akses Ditolak',
        description: 'Halaman ini khusus untuk admin.',
      });
      router.replace('/');
    }
  }, [user, userProfile, isUserLoading, isProfileLoading, router, toast]);

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
      <AdminSidebar user={user as User} userProfile={userProfile} />
      <main className="pb-24 pt-14 md:pt-0 md:pb-0">{children}</main>
    </div>
  );
}
