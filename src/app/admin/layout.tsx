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
  
  // Combine loading states
  const isLoading = isUserLoading || isProfileLoading;
  
  useEffect(() => {
    // Wait until all loading is complete before making any decisions
    if (isLoading) {
      return;
    }

    // If loading is done and there's no user, redirect to login
    if (!user) {
      router.replace('/login');
      return;
    }

    // If loading is done and user is not an admin, redirect to home
    if (userProfile?.role !== 'admin') {
      router.replace('/');
    }
  }, [user, userProfile, isLoading, router]);


  // This is the gatekeeper. It shows a full-screen loader until we are certain
  // about the user's auth state and role. Only when the user is confirmed
  // to be an admin will it render the actual layout with children.
  if (isLoading || !user || !userProfile || userProfile.role !== 'admin') {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // At this point, we are sure the user is a logged-in admin.
  return (
    <div className="md:grid md:grid-cols-[250px_1fr]">
      <AdminSidebar user={user as User} userProfile={userProfile} />
      <main className="pb-24 pt-14 md:pt-0 md:pb-0">{children}</main>
    </div>
  );
}
