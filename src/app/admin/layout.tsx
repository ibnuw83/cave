'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile } from '@/lib/firestore';
import { Loader2, Mountain, MapPin, Users, Home, LogOut, ArrowLeft, Airplay } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


function AdminSidebar() {
    const { user, userProfile, signOut } = useAuth();

    if (!user || !userProfile) return null;

    return (
        <aside className="fixed bottom-0 z-50 w-full border-t bg-card p-2 md:relative md:flex md:h-screen md:flex-col md:border-r md:border-t-0 md:p-0">
            <div className="hidden md:flex items-center gap-2 p-4 border-b">
                <Mountain className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold font-headline">Admin Panel</h2>
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
                    <AvatarImage src={user.photoURL || ''} alt={userProfile.displayName || 'Admin'} />
                    <AvatarFallback>{userProfile.displayName?.charAt(0) || 'A'}</AvatarFallback>
                    </Avatar>
                    <div>
                    <p className="text-sm font-medium leading-tight">{userProfile.displayName}</p>
                    <p className="text-xs text-muted-foreground">{userProfile.email}</p>
                    </div>
                </div>
                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" asChild>
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali ke Situs
                    </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </aside>
    );
}

function AdminNavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link 
      href={href}
      className={cn(
        'flex flex-col items-center justify-center rounded-md p-2 text-xs font-medium transition-colors md:flex-row md:justify-start md:gap-3 md:text-sm md:px-3 md:py-2',
        isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      )}
    >
      {icon}
      <span className="mt-1 md:mt-0">{label}</span>
    </Link>
  );
}


export default function AdminLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const profile = await getUserProfile(user.uid);
                    if (profile && profile.role === 'admin') {
                        setIsAuthorized(true);
                    } else {
                        toast({
                            variant: 'destructive',
                            title: 'Akses Ditolak',
                            description: 'Halaman ini khusus untuk admin.',
                        });
                        router.replace('/');
                    }
                } catch (error) {
                    console.error("Failed to get user profile", error);
                    router.replace('/');
                }
            } else {
                router.replace('/login');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router, toast]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-lg text-muted-foreground">Memeriksa otorisasi...</p>
                </div>
            </div>
        );
    }
    
    if (!isAuthorized) {
        // This will be briefly visible before the redirect kicks in, 
        // or if the redirect fails for some reason.
        return null;
    }

    return (
        <div className="md:grid md:grid-cols-[250px_1fr]">
            <AdminSidebar />
            <main className="pb-24 md:pb-0">{children}</main>
        </div>
    );
}
