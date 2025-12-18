'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Mountain, MapPin, Users, Home, LogOut, ArrowLeft, Airplay } from 'lucide-react';


function AdminNavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link 
      href={href}
      className={cn(
        'flex flex-col items-center justify-center rounded-md p-2 text-xs font-medium transition-colors md:flex-row md:justify-start md:gap-3 md:text-sm md:px-3 md:py-2',
        isActive ? 'bg-primary/20 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      )}
    >
      {icon}
      <span className="mt-1 md:mt-0">{label}</span>
    </Link>
  );
}


export default function AdminSidebar() {
  const { user, userProfile, signOut } = useAuth();

  if (!user || !userProfile || userProfile.role !== 'admin') return null;

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <aside className="fixed bottom-0 z-50 w-full border-t bg-card p-2 md:relative md:flex md:h-screen md:flex-col md:border-r md:border-t-0 md:p-0">
      <div className="hidden md:flex items-center gap-2 p-4 border-b">
        <Mountain className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">Admin Panel</h2>
      </div>

      <nav className="grid grid-cols-5 gap-1 md:flex md:flex-col md:gap-1 md:p-4">
        <AdminNavLink href="/admin" icon={<Home />} label="Dashboard" />
        <AdminNavLink href="/admin/caves" icon={<Mountain />} label="Gua" />
        <AdminNavLink href="/admin/spots" icon={<MapPin />} label="Spot" />
        <AdminNavLink href="/admin/users" icon={<Users />} label="Pengguna" />
        <AdminNavLink href="/admin/kiosk" icon={<Airplay />} label="Kios" />
      </nav>

      <div className="hidden md:block mt-auto p-4 border-t">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.photoURL || ''} />
            <AvatarFallback>{userProfile.displayName?.charAt(0) || 'A'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{userProfile.displayName}</p>
            <p className="text-xs text-muted-foreground">{userProfile.email}</p>
          </div>
        </div>

        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Situs
          </Link>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
