
'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Home, Mountain, MapPin, Users, Loader2, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function AdminProtection({ children }: { children: ReactNode }) {
  const { userProfile, loading, signOut } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!userProfile || userProfile.role !== 'admin') {
        router.replace('/');
      } else {
        setIsAuthorized(true);
      }
    }
  }, [userProfile, loading, router]);

  if (!isAuthorized) {
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
    <div className="md:flex">
      <nav className="fixed bottom-0 z-50 w-full border-t bg-card p-2 md:relative md:h-screen md:w-64 md:border-r md:border-t-0">
        <div className="hidden md:block p-4 border-b">
          <h2 className="text-xl font-bold font-headline">Admin Panel</h2>
        </div>
        <div className="grid grid-cols-4 gap-2 md:flex md:flex-col md:gap-2 md:p-4">
          <AdminNavLink href="/admin" icon={<Home />} label="Dashboard" />
          <AdminNavLink href="/admin/caves" icon={<Mountain />} label="Gua" />
          <AdminNavLink href="/admin/spots" icon={<MapPin />} label="Spot" />
          <AdminNavLink href="/admin/users" icon={<Users />} label="Pengguna" />
        </div>
        <div className="hidden md:block absolute bottom-0 left-0 w-full p-4 border-t">
          <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </nav>
      <main className="flex-1 pb-24 md:pb-0">{children}</main>
    </div>
  );
}

function AdminNavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link href={href} legacyBehavior>
      <a
        className={`flex flex-col items-center justify-center rounded-md p-2 text-sm font-medium transition-colors md:flex-row md:justify-start md:px-3 md:py-2 ${
          isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
        }`}
      >
        {icon}
        <span className="mt-1 md:mt-0 md:ml-3">{label}</span>
      </a>
    </Link>
  );
}


export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminProtection>{children}</AdminProtection>;
}
