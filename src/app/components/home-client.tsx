'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cave, KioskSettings } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Mountain, LogIn, LogOut, User, Trash2, ArrowDown, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { clearOfflineCache } from '@/lib/offline';
import { useToast } from '@/hooks/use-toast';
import { getKioskSettings } from '@/lib/firestore';
import placeholderImages from '@/lib/placeholder-images.json';
import { useRouter } from 'next/navigation';

// Komponen Bat untuk animasi kelelawar
function Bat({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute top-0 left-0 text-black will-change-transform"
      style={{ animation: 'fly linear infinite', ...style }}
    >
      <div className="will-change-transform" style={{ animation: 'flap 0.2s ease-in-out infinite alternate' }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-full h-full"
        >
          <path d="M2.21,12.52a0.5,0.5,0,0,1-.42-0.81,9.5,9.5,0,0,1,6-4.43c0.16-.05.32,0.06,0.37,0.22s-0.06,0.32-.22,0.37a8.5,8.5,0,0,0-5.35,3.95A0.5,0.5,0,0,1,2.21,12.52Z" />
          <path d="M21.79,12.52a0.5,0.5,0,0,1-.37-0.68,8.5,8.5,0,0,0-5.35-3.95c-0.16-.05-0.27-0.21-0.22-0.37s0.06-0.32,0.22-0.37a9.5,9.5,0,0,1,6,4.43,0.5,0.5,0,0,1-.28.85Z" />
          <path d="M12,12.53a4.5,4.5,0,0,1-3-1.25,1,1,0,0,1,1.41-1.42,2.5,2.5,0,0,0,3.18,0,1,1,0,1,1,1.41,1.42A4.49,4.49,0,0,1,12,12.53Z" />
          <path d="M12,14.5a0.5,0.5,0,0,1-.5-0.5v-2a0.5,0.5,0,0,1,1,0v2A0.5,0.5,0,0,1,12,14.5Z" />
          <path d="M10.5,12.5a0.5,0.5,0,0,1-.5-0.5v-1a0.5,0.5,0,0,1,1,0v1A0.5,0.5,0,0,1,10.5,12.5Z" />
          <path d="M13.5,12.5a0.5,0.5,0,0,1-.5-0.5v-1a0.5,0.5,0,0,1,1,0v1A0.5,0.5,0,0,1,13.5,12.5Z" />
          <path d="M12,2.5a0.5,0.5,0,0,1-.5-0.5v-1a0.5,0.5,0,0,1,1,0v1A0.5,0.5,0,0,1,12,2.5Z" />
          <path d="M12,22.5a10.47,10.47,0,0,1-7.21-3,0.5,0.5,0,0,1,.71-0.71,9.47,9.47,0,0,0,13,0,0.5,0.5,0,0,1,.71.71A10.47,10.47,0,0,1,12,22.5Z" />
        </svg>
      </div>
    </div>
  );
}

const AuthSection = () => {
  const { user, userProfile, loading, signOut } = useAuth();
  const { toast } = useToast();

  const handleClearCache = async () => {
    if (!confirm('Anda yakin ingin menghapus semua konten offline? Ini tidak dapat diurungkan.')) {
      return;
    }
    try {
      await clearOfflineCache();
      toast({ title: 'Berhasil', description: 'Semua konten offline telah dihapus.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menghapus cache offline.' });
    }
  };


  if (loading) {
    return null;
  }

  if (user && userProfile) {
    return (
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photoURL || ''} alt={userProfile.displayName || 'User'} />
              <AvatarFallback>{userProfile.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userProfile.displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {userProfile.email}
              </p>
            </div>
             <Badge variant={userProfile.role === 'pro' ? 'default' : 'secondary'} className="uppercase mt-2">
                {userProfile.role}
            </Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
           {userProfile.role === 'admin' && (
             <>
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <User className="mr-2 h-4 w-4" />
                    <span>Admin Panel</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
             </>
           )}
            {userProfile.role !== 'free' && (
             <>
                <DropdownMenuItem onClick={handleClearCache}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Hapus Cache Offline</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
             </>
           )}
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return null;
};


export default function HomeClient({ initialCaves }: { initialCaves: Cave[] }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<KioskSettings | null>(null);

  const heroImage = placeholderImages.placeholderImages.find(img => img.id === 'spot-jomblang-light')?.imageUrl || '/placeholder.jpg';

  useEffect(() => {
    async function fetchSettings() {
      const fetchedSettings = await getKioskSettings();
      setSettings(fetchedSettings);
    }
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Memuat sesi pengguna...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen">
      <header className="relative flex h-[70vh] w-full flex-col items-center justify-center text-center text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={heroImage}
            alt="Pemandangan dramatis di dalam gua"
            fill
            className="object-cover"
            priority
            data-ai-hint="dramatic cave"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black" />
          
          {/* Animasi Kelelawar */}
          <Bat style={{ '--scale': 0.1, '--y-start': '20vh', '--y-end': '50vh', animationDuration: '15s', animationDelay: '0s' } as React.CSSProperties} />
          <Bat style={{ '--scale': 0.08, '--y-start': '30vh', '--y-end': '60vh', animationDuration: '20s', animationDelay: '3s' } as React.CSSProperties} />
          <Bat style={{ '--scale': 0.12, '--y-start': '40vh', '--y-end': '55vh', animationDuration: '18s', animationDelay: '5s' } as React.CSSProperties} />
          <Bat style={{ '--scale': 0.09, '--y-start': '25vh', '--y-end': '45vh', animationDuration: '22s', animationDelay: '8s' } as React.CSSProperties} />

        </div>

        <div className="relative z-10 flex h-full flex-col justify-center p-4 md:p-8 w-full">
           <div className="absolute top-4 right-4">
                <AuthSection />
            </div>

            <div className="flex flex-col items-center">
                 <div className="flex items-center gap-4 mb-4">
                    {settings?.logoUrl ? (
                        <Image src={settings.logoUrl} alt="App Logo" width={48} height={48} className="h-12 w-12" />
                    ) : (
                        <Mountain className="h-12 w-12" />
                    )}
                    <h1 className="text-4xl font-bold tracking-tight md:text-5xl font-headline bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">
                        Penjelajah Gua
                    </h1>
                </div>
                 <h2 className="text-4xl md:text-6xl font-bold font-rimba drop-shadow-2xl">Masuki Dunia Bawah Tanah</h2>
                 <p className="mt-4 max-w-xl text-lg md:text-xl text-white/80">
                    Rasakan pengalaman 4D menjelajahi keindahan gua-gua paling eksotis di Indonesia.
                 </p>
                 <Button size="lg" className="mt-8" asChild>
                    <Link href="#cave-list">
                        Mulai Menjelajah
                        <ArrowDown className="ml-2 h-5 w-5" />
                    </Link>
                 </Button>
            </div>
        </div>
      </header>

      <main id="cave-list" className="bg-black py-16 md:py-24">
         <div className="container mx-auto max-w-5xl px-4 md:px-8">
            <h2 className="mb-8 text-center text-3xl font-semibold text-white/90 md:text-4xl">Gua yang Tersedia</h2>
            {initialCaves.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {initialCaves.map((cave) => (
                <Link href={`/cave/${cave.id}`} key={cave.id} className="group">
                    <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-primary/20 hover:shadow-2xl hover:border-primary/50 hover:-translate-y-2 bg-card border-border/50">
                    <CardHeader className="p-0">
                        <div className="relative h-56 w-full">
                        <Image
                            src={cave.coverImage}
                            alt={`Gambar ${cave.name}`}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                            data-ai-hint="cave entrance"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                           <CardTitle className="text-lg font-bold font-headline text-white transition-transform duration-300 group-hover:translate-y-[-4px]">{cave.name}</CardTitle>
                         </div>
                        </div>
                    </CardHeader>
                    </Card>
                </Link>
                ))}
            </div>
            ) : (
            <p className="text-center text-muted-foreground">Tidak ada gua yang tersedia saat ini. Silakan tambahkan melalui Panel Admin.</p>
            )}
        </div>
      </main>
    </div>
  );
}
