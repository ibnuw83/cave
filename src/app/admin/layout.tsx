'use client';

import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import AdminSidebar from './admin-sidebar';
import { Loader2 } from 'lucide-react';
import { User } from 'firebase/auth';

// This is now a client component to use the client-side useUser hook.
export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, userProfile, isUserLoading, isProfileLoading } = useUser();

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // 1. Client-Side Redirect: If no user is logged in, redirect to login.
  if (!user) {
    redirect('/login');
  }

  // 2. Client-Side Role Check: If user is not an admin, redirect to home.
  if (!userProfile || userProfile.role !== 'admin') {
    redirect('/');
  }

  // At this point, we know we have an authenticated admin user and their profile.
  return (
    <div className="md:grid md:grid-cols-[250px_1fr]">
      <AdminSidebar user={user as User} userProfile={userProfile} />
      <main className="pb-24 pt-14 md:pt-0 md:pb-0">{children}</main>
    </div>
  );
}
