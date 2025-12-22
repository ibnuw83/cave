
import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user-server';
import AdminSidebar from './admin-sidebar';
import { Loader2 } from 'lucide-react';
import { User } from 'firebase/auth';

// This is now a Server Component to enforce security on the server.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user, userProfile } = await useUser();

  // 1. Server-Side Redirect: If no user is logged in, redirect to login.
  if (!user) {
    redirect('/login');
  }

  // 2. Server-Side Role Check: If user is not an admin, redirect to home.
  // userProfile might be null if the Firestore doc isn't created yet.
  if (!userProfile || userProfile.role !== 'admin') {
    redirect('/');
  }

  // At this point, we know we have an authenticated admin user and their profile.
  // We can now render the layout with the client components.
  // The client-side loading checks are no longer necessary as auth is confirmed on the server.
  
  return (
    <div className="md:grid md:grid-cols-[250px_1fr]">
      {/* AdminSidebar remains a client component for interactivity */}
      <AdminSidebar user={user as User} userProfile={userProfile} />
      <main className="pb-24 pt-14 md:pt-0 md:pb-0">{children}</main>
    </div>
  );
}
