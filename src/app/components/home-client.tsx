
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
      <header className="relative flex h-[70vh] w-full flex-col items-center justify-center text-center text-white">
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
        </div>

        <div className="relative z-10 flex h-full flex-col justify-center p-4 md:p-8 w-full">
           <div className="absolute top-4 right-4">
                <AuthSection />
            </div>

            <div className="flex flex-col items-center">
                 <div className="flex items-center gap-3 mb-4">
                    {settings?.logoUrl ? (
                        <Image src={settings.logoUrl} alt="App Logo" width={40} height={40} className="h-10 w-10" />
                    ) : (
                        <Mountain className="h-10 w-10" />
                    )}
                    <h1 className="text-3xl font-bold tracking-tight md:text-4xl font-headline">
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
