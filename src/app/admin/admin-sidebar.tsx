
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Mountain, MapPin, Users, Home, LogOut, ArrowLeft, Settings, User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { KioskSettings, UserProfile } from '@/lib/types';
import Image from 'next/image';
import { useAuth } from '@/firebase';
import { User, signOut as firebaseSignOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"


function AdminNavLink({ href, icon, label, color, activeColor }: { href: string; icon: React.ReactNode; label: string; color: string; activeColor: string; }) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href) && (href !== '/admin' || pathname === '/admin');
  
  return (
    <Link 
      href={href}
      className={cn(
        'flex flex-col items-center justify-center rounded-md p-2 text-xs font-medium transition-colors md:flex-row md:justify-start md:gap-3 md:text-sm md:px-3 md:py-2',
        isActive ? `bg-primary/20 ${activeColor} border border-primary/20` : `${color} hover:bg-muted/50 hover:text-foreground`
      )}
    >
      {icon}
      <span className="mt-1 md:mt-0">{label}</span>
    </Link>
  );
}


export default function AdminSidebar({ user, userProfile }: { user: User; userProfile: UserProfile }) {
  const [settings, setSettings] = useState<KioskSettings | null>(null);
  const [isProfileSheetOpen, setProfileSheetOpen] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const isSubPage = pathname !== '/admin';

  useEffect(() => {
    // Kiosk settings are not critical, so we don't need to fetch them in a blocking way
    // getKioskSettings().then(setSettings);
  }, []);

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
      setProfileSheetOpen(false); // Close sheet on logout
      router.push('/login');
      toast({
        title: "Logout Berhasil",
        description: "Anda telah keluar dari akun.",
      });
    } catch (error) {
       toast({
        title: "Logout Gagal",
        description: "Terjadi kesalahan saat mencoba logout.",
        variant: "destructive",
      });
    }
  };

  return (
    <aside className="fixed bottom-0 z-50 w-full border-t bg-card p-2 md:relative md:flex md:h-screen md:flex-col md:border-r md:border-t-0 md:p-0">
      <div className="hidden md:flex items-center gap-2 p-4 border-b">
         {settings?.logoUrl ? (
            <Image src={settings.logoUrl} alt="App Logo" width={24} height={24} className="h-6 w-6" />
          ) : (
            <Mountain className="h-6 w-6 text-primary" />
          )}
        <h2 className="text-xl font-bold">Admin Panel</h2>
      </div>

       {/* Mobile Header with Back Button */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
        {isSubPage ? (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : (
           <div className="flex items-center gap-2 shrink-0">
            {settings?.logoUrl ? (
              <Image src={settings.logoUrl} alt="App Logo" width={24} height={24} className="h-6 w-6" />
            ) : (
              <Mountain className="h-6 w-6 text-primary" />
            )}
          </div>
        )}
        <h2 className="text-lg font-bold text-center truncate flex-1 mx-4">
          {isSubPage ? pathname.split('/').pop()?.replace('-', ' ')?.replace(/\b\w/g, l => l.toUpperCase()) : 'Dashboard'}
        </h2>
        
        <Sheet open={isProfileSheetOpen} onOpenChange={setProfileSheetOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={userProfile.photoURL || ''} />
                        <AvatarFallback>{userProfile.displayName?.charAt(0) || 'A'}</AvatarFallback>
                    </Avatar>
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className='rounded-t-lg'>
                <SheetHeader className='text-left'>
                    <SheetTitle>Profil & Sesi</SheetTitle>
                    <SheetDescription>Kelola akun, pengguna, dan sesi Anda dari sini.</SheetDescription>
                </SheetHeader>
                <div className="py-4 space-y-2">
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 mb-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={userProfile.photoURL || ''} />
                            <AvatarFallback>{userProfile.displayName?.charAt(0) || 'A'}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-md font-medium">{userProfile.displayName}</p>
                            <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="ghost" className="w-full justify-start" asChild>
                            <Link href="/" onClick={() => setProfileSheetOpen(false)}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Kembali ke Situs
                            </Link>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start" asChild>
                            <Link href="/admin/users" onClick={() => setProfileSheetOpen(false)}>
                                <Users className="mr-2 h-4 w-4" />
                                Manajemen Pengguna
                            </Link>
                        </Button>
                         <Button variant="ghost" className="w-full justify-start" asChild>
                            <Link href="/profile" onClick={() => setProfileSheetOpen(false)}>
                                <UserIcon className="mr-2 h-4 w-4" />
                                Profil Pengguna
                            </Link>
                        </Button>
                    </div>

                      <Button
                        variant="destructive"
                        className="w-full justify-center mt-4"
                        onClick={handleLogout}
                        >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
      </div>


      {/* Main Navigation */}
      <nav className="grid grid-cols-4 gap-1 md:flex md:flex-col md:gap-1 md:p-4">
        <AdminNavLink href="/admin" icon={<Home />} label="Dashboard" color="text-sky-400" activeColor="text-sky-300" />
        <AdminNavLink href="/admin/caves" icon={<Mountain />} label="Gua" color="text-amber-400" activeColor="text-amber-300" />
        <AdminNavLink href="/admin/spots" icon={<MapPin />} label="Spot" color="text-rose-400" activeColor="text-rose-300" />
        <div className="md:block">
            <AdminNavLink href="/admin/users" icon={<Users />} label="Pengguna" color="text-emerald-400" activeColor="text-emerald-300" />
        </div>
        <AdminNavLink href="/admin/kiosk" icon={<Settings />} label="Pengaturan" color="text-violet-400" activeColor="text-violet-300" />
      </nav>

      {/* Desktop User Profile Section */}
      <div className="hidden md:block mt-auto p-4 border-t">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={userProfile.photoURL || ''} />
            <AvatarFallback>{userProfile.displayName?.charAt(0) || 'A'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{userProfile.displayName}</p>
            <p className="text-xs text-muted-foreground">{userProfile.email}</p>
          </div>
        </div>
        
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/profile">
            <UserIcon className="mr-2 h-4 w-4" />
            Profil Pengguna
          </Link>
        </Button>
        
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Situs
          </Link>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive-foreground hover:bg-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
