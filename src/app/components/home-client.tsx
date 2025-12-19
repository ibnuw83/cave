'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Cave, KioskSettings, UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Mountain, LogOut, User, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { clearOfflineCache } from '@/lib/offline';
import { useToast } from '@/hooks/use-toast';
import { getKioskSettings } from '@/lib/firestore';
import placeholderImages from '@/lib/placeholder-images.json';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useAuth, useMemoFirebase } from '@/firebase';
import { doc, signOut as firebaseSignOut } from 'firebase/firestore';


const AuthSection = () => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

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

  const handleLogout = async () => {
     try {
      await firebaseSignOut(auth);
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
  }


  if (isUserLoading || isProfileLoading) {
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
          <DropdownMenuItem onClick={handleLogout}>
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
  const [settings, setSettings] = useState<KioskSettings | null>(null);
  const { isUserLoading } = useUser();

  const heroImage = placeholderImages.placeholderImages.find(img => img.id === 'spot-jomblang-light')?.imageUrl || '/placeholder.jpg';

  useEffect(() => {
    async function fetchSettings() {
      const fetchedSettings = await getKioskSettings();
      setSettings(fetchedSettings);
    }
    fetchSettings();
  }, []);
  

  if (isUserLoading) {
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
                 <h2 className="text-4xl md:text-6xl font-bold font-headline drop-shadow-2xl animate-wave">Masuki Dunia Bawah Tanah</h2>
                 <p className="mt-4 max-w-xl text-lg md:text-xl text-white/80">
                    Rasakan pengalaman 4D menjelajahi keindahan gua-gua paling eksotis di Indonesia.
                 </p>
                 <Button size="lg" className="mt-8" asChild>
                    <Link href="/login">
                        Mulai Menjelajah
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                 </Button>
            </div>
        </div>
      </header>

      <main id="cave-list" className="bg-black pb-16">
         <div className="container mx-auto max-w-5xl px-4 md:px-8">
            <h2 className="mb-8 text-center text-3xl font-semibold text-white/90 md:text-4xl">Gua yang Tersedia</h2>
            {initialCaves.length > 0 ? (
            <Carousel
              opts={{
                align: "start",
              }}
              className="w-full"
            >
              <CarouselContent>
                {initialCaves.map((cave) => (
                  <CarouselItem key={cave.id} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                      <Link href={`/cave/${cave.id}`} className="group">
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
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex" />
              <CarouselNext className="hidden sm:flex" />
            </Carousel>
            ) : (
            <p className="text-center text-muted-foreground">Tidak ada gua yang tersedia saat ini. Silakan tambahkan melalui Panel Admin.</p>
            )}
        </div>
      </main>
    </div>
  );
}
