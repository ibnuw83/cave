'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import AdminSidebar from './admin-sidebar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!userProfile || userProfile.role !== 'admin') {
      toast({
        variant: 'destructive',
        title: 'Akses Ditolak',
        description: 'Halaman ini khusus untuk admin.',
      });
      router.replace('/');
    }
  }, [user, userProfile, loading, router, toast]);

  if (loading || !userProfile) {
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
      <AdminSidebar />
      <main className="pb-24 md:pb-0">{children}</main>
    </div>
  );
}
