'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cave, KioskSettings } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Mountain, LogIn, LogOut, User, Trash2 } from 'lucide-react';
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
import { getKioskSettings, getCaves } from '@/lib/firestore';
import placeholderImagesData from '@/lib/placeholder-images.json';


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

  return (
    <Button asChild>
      <Link href="/login">
        <LogIn className="mr-2 h-4 w-4" /> Masuk
      </Link>
    </Button>
  );
};


export default function Home() {
  const { loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<KioskSettings | null>(null);
  const [initialCaves, setInitialCaves] = useState<Cave[]>([]);
  const [loadingCaves, setLoadingCaves] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      const fetchedSettings = await getKioskSettings();
      setSettings(fetchedSettings);
    }
    fetchSettings();
  }, []);

  useEffect(() => {
    async function fetchCaves() {
        setLoadingCaves(true);
         // Ambil data dari Firestore
        let firestoreCaves: Cave[] = [];
        try {
            firestoreCaves = await getCaves(false);
        } catch (error) {
            console.error("Gagal mengambil data dari Firestore, akan menggunakan data contoh:", error);
        }

        // Siapkan data contoh statis dari file JSON
        const placeholderImages = placeholderImagesData.placeholderImages;
        const jomblangCover = placeholderImages.find(p => p.id === 'cave-jomblang-cover')?.imageUrl;
        const gongCover = placeholderImages.find(p => p.id === 'cave-gong-cover')?.imageUrl;
        const petrukCover = placeholderImages.find(p => p.id === 'cave-petruk-cover')?.imageUrl;

        const staticCaves: Cave[] = [];

        if (jomblangCover) {
            staticCaves.push({
            id: 'static-jomblang',
            name: 'Gua Jomblang (Contoh)',
            description: 'Gua vertikal dengan cahaya surga yang menakjubkan.',
            coverImage: jomblangCover,
            isActive: true,
            });
        }

        if (gongCover) {
            staticCaves.push({
            id: 'static-gong',
            name: 'Gua Gong (Contoh)',
            description: 'Dijuluki sebagai gua terindah di Asia Tenggara.',
            coverImage: gongCover,
            isActive: true,
            });
        }
        
        if (petrukCover) {
            staticCaves.push({
                id: 'static-petruk',
                name: 'Gua Petruk (Contoh)',
                description: 'Gua Petruk di Kebumen adalah destinasi wisata alam karst yang menawarkan pengalaman caving (susur gua) menantang.',
                coverImage: petrukCover,
                isActive: true,
            });
        }


        // Gabungkan data dari Firestore dan data statis
        // Hapus duplikat berdasarkan nama gua
        const combinedCaves = [...firestoreCaves];
        staticCaves.forEach(staticCave => {
            if (!firestoreCaves.some(fc => fc.name.includes(staticCave.name.replace(' (Contoh)', '')))) {
            combinedCaves.push(staticCave);
            }
        });
        
        // Jika tidak ada data sama sekali, tampilkan data contoh
        const finalCaves = combinedCaves.length > 0 ? combinedCaves : staticCaves;

        setInitialCaves(finalCaves);
        setLoadingCaves(false);
    }
    fetchCaves();
  }, [])
  
  return (
    <div className="container mx-auto min-h-screen max-w-4xl p-4 md:p-8">
      <header className="flex items-center justify-between pb-8">
        <div className="flex items-center gap-3">
          {settings?.logoUrl ? (
             <Image src={settings.logoUrl} alt="App Logo" width={32} height={32} className="h-8 w-8" />
          ) : (
            <Mountain className="h-8 w-8 text-primary" />
          )}
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl font-headline">
            Penjelajah Gua
          </h1>
        </div>
        <AuthSection />
      </header>

      <main>
        <h2 className="mb-6 text-xl font-semibold text-foreground/90 md:text-2xl">Gua yang Tersedia</h2>
        {authLoading || loadingCaves ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : initialCaves.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {initialCaves.map((cave) => (
              <Link href={`/cave/${cave.id}`} key={cave.id} className="group">
                <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:scale-105">
                  <CardHeader className="p-0">
                    <div className="relative h-48 w-full">
                      <Image
                        src={cave.coverImage}
                        alt={`Gambar ${cave.name}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        data-ai-hint="cave entrance"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-lg font-bold font-headline">{cave.name}</CardTitle>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Tidak ada gua yang tersedia saat ini.</p>
        )}
      </main>
    </div>
  );
}
