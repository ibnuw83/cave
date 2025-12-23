'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import AdminSidebar from './admin-sidebar';
import { Loader2 } from 'lucide-react';
import { User } from 'firebase/auth';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, userProfile, isUserLoading, isProfileLoading } = useUser();
  const router = useRouter();
  
  const isLoading = isUserLoading || isProfileLoading;

  useEffect(() => {
    if (isLoading) return; // Wait until loading is complete

    if (!user) {
      router.replace('/login');
      return;
    }

    if (userProfile?.role !== 'admin') {
      router.replace('/');
    }
  }, [user, userProfile, isLoading, router]);


  if (isLoading || !user || !userProfile || userProfile.role !== 'admin') {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
