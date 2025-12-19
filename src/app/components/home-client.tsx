
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cave, KioskSettings } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Mountain, LogIn, LogOut, User, Trash2, ArrowDown } from 'lucide-react';
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
          <path d="M12.383 1.575C12.183 1.525 11.817 1.525 11.617 1.575C7.947 2.455 5.097 5.105 4.317 8.575C4.217 9.045 3.947 9.385 3.517 9.535C2.557 9.875 1.547 10.035 0.5170000000000001 10.075L0 10.085V13.915L0.5170000000000001 13.925C1.547 13.965 2.557 14.125 3.517 14.465C3.947 14.615 4.217 14.955 4.317 15.425C5.097 18.895 7.947 21.545 11.617 22.425C11.817 22.475 12.183 22.475 12.383 22.425C16.053 21.545 18.903 18.895 19.683 15.425C19.783 14.955 20.053 14.615 20.483 14.465C21.443 14.125 22.453 13.965 23.483 13.925L24 13.915V10.085L23.483 10.075C22.453 10.035 21.443 9.875 20.483 9.535C20.053 9.385 19.783 9.045 19.683 8.575C18.903 5.105 16.053 2.455 12.383 1.575Z" />
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
    return <Skeleton className="h-10 w-10 rounded-full" />;
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
  const { loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<KioskSettings | null>(null);

  const heroImage = placeholderImages.placeholderImages.find(img => img.id === 'spot-jomblang-light')?.imageUrl || '/placeholder.jpg';

  useEffect(() => {
    async function fetchSettings() {
      const fetchedSettings = await getKioskSettings();
      setSettings(fetchedSettings);
    }
    fetchSettings();
  }, []);
  
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
            {authLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
            </div>
            ) : initialCaves.length > 0 ? (
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
                         <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <CardTitle className="text-lg font-bold font-headline text-foreground">{cave.name}</CardTitle>
                    </CardContent>
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
