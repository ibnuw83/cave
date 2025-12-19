'use client';

import { useState, useEffect, useMemo } from 'react';
import { Cave, Spot, UserProfile } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, ChevronLeft, Download, WifiOff, Loader2, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { saveCaveForOffline, isCaveAvailableOffline } from '@/lib/offline';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';


function SpotCard({ spot, isLocked, isOffline }: { spot: Spot; isLocked: boolean, isOffline: boolean }) {
  const content = (
    <Card className={`overflow-hidden transition-all duration-300 ${isLocked ? 'bg-muted/30 border-dashed' : 'hover:shadow-lg hover:border-primary/50 hover:scale-105'}`}>
      <CardHeader className="p-0">
        <div className="relative h-40 w-full">
          <Image
            src={spot.imageUrl}
            alt={spot.title}
            fill
            className={`object-cover ${isLocked ? 'opacity-50' : 'group-hover:scale-110 transition-transform duration-300'}`}
            data-ai-hint="cave interior"
          />
          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Lock className="h-8 w-8 text-accent" />
            </div>
          )}
           {isOffline && (
            <div className="absolute top-2 right-2 flex items-center justify-center bg-black/50 p-1 rounded-full">
              <WifiOff className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-md font-bold font-headline">{spot.title}</CardTitle>
        <CardDescription className={`mt-1 text-sm ${isLocked ? 'text-muted-foreground/80' : 'text-muted-foreground'}`}>
          {spot.description.substring(0, 70)}...
        </CardDescription>
      </CardContent>
    </Card>
  );

  if (isLocked) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-not-allowed">{content}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Upgrade ke PRO untuk mengakses spot ini.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Link href={`/spot/${spot.id}`} className="group">
      {content}
    </Link>
  );
}

export default function CaveClient({ cave, spots }: { cave: Cave; spots?: Spot[];}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isOffline, setIsOffline] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);


  useEffect(() => {
    async function checkOfflineStatus() {
      const offline = await isCaveAvailableOffline(cave.id);
      setIsOffline(offline);
    }
    checkOfflineStatus();
  }, [cave.id]);

  const handleDownload = async () => {
    if (!spots) return;
    setIsDownloading(true);
    toast({ title: 'Mengunduh...', description: `Konten untuk ${cave.name} sedang disimpan untuk mode offline.` });
    try {
      await saveCaveForOffline(cave, spots);
      setIsOffline(true);
      toast({ title: 'Berhasil!', description: `${cave.name} telah tersedia untuk mode offline.` });
    } catch (error) {
      console.error('Failed to save for offline:', error);
      toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menyimpan konten untuk mode offline.' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleStartMission = () => {
    if (sortedSpots.length > 0) {
      router.push(`/spot/${sortedSpots[0].id}`);
    } else {
      toast({
        variant: 'destructive',
        title: 'Misi Tidak Tersedia',
        description: 'Tidak ada spot yang ditemukan di gua ini untuk memulai misi.',
      });
    }
  };

  const loading = isUserLoading || isProfileLoading;

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

  const role = userProfile?.role || 'free';
  const isPro = role === 'pro' || role === 'admin';
  const sortedSpots = spots ? [...spots].sort((a, b) => a.order - b.order) : [];

  return (
    <div className="container mx-auto min-h-screen max-w-5xl p-4 md:p-8">
      <header className="mb-8">
        <Button variant="ghost" asChild className="mb-4 -ml-4">
          <Link href="/">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Gua
          </Link>
        </Button>
        <div className="relative h-64 w-full overflow-hidden rounded-lg shadow-xl">
          <Image src={cave.coverImage} alt={cave.name} fill className="object-cover" data-ai-hint="cave landscape" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          <h1 className="font-headline absolute bottom-4 left-4 text-3xl font-bold text-white md:text-4xl">
            {cave.name}
          </h1>
           {isOffline && (
            <div className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-sm text-white backdrop-blur-sm">
              <WifiOff className="h-4 w-4" />
              <span>Offline Ready</span>
            </div>
          )}
        </div>
      </header>

      <main>
        <div className="mb-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold md:text-2xl">Misi Penjelajahan</h2>
              <p className="text-muted-foreground text-sm">Temukan artefak tersembunyi di dalam gua ini.</p>
            </div>
            <div className='flex items-center gap-2 flex-wrap'>
                <Button onClick={handleStartMission} size="lg">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Mulai Misi
                </Button>
                {isPro && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <Button onClick={handleDownload} disabled={isDownloading || isOffline} variant="outline">
                                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isOffline ? <WifiOff className="mr-2 h-4 w-4"/> : <Download className="mr-2 h-4 w-4" />}
                                        {isOffline ? 'Tersimpan' : 'Simpan Offline'}
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{isOffline ? 'Konten gua ini sudah bisa diakses offline.' : 'Unduh semua spot di gua ini untuk akses offline.'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
        </div>

        <h3 className="text-lg font-semibold md:text-xl mb-4 mt-8">Daftar Spot</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedSpots.map((spot) => (
            <SpotCard key={spot.id} spot={spot} isLocked={spot.isPro && role === 'free'} isOffline={isOffline} />
          ))}
        </div>
      </main>
    </div>
  );
}
