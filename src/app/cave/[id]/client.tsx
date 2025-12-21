'use client';

import { useState, useEffect } from 'react';
import { Location, Spot } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, ChevronLeft, Download, WifiOff, Loader2, Sparkles, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { saveLocationForOffline, isLocationAvailableOffline } from '@/lib/offline';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import AdBanner from '@/app/components/AdBanner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function SpotCard({ spot, isLocked, isOffline, lockedMessage }: { spot: Spot; isLocked: boolean; isOffline: boolean, lockedMessage: string; }) {
  const content = (
    <Card className={`overflow-hidden transition-all duration-300 ${isLocked ? 'bg-muted/30 border-dashed cursor-pointer hover:border-primary/50 hover:scale-105' : 'hover:shadow-lg hover:border-primary/50 hover:scale-105'}`}>
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
       <Link href="/pricing" className="group">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {content}
            </TooltipTrigger>
            <TooltipContent>
              <p>{lockedMessage}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Link>
    );
  }

  return (
    <Link href={`/spot/${spot.id}`} className="group">
      {content}
    </Link>
  );
}

export default function CaveClient({ location, spots }: { location: Location, spots: Spot[] }) {
  const { user, userProfile } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [isOffline, setIsOffline] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Check offline status on mount
    isLocationAvailableOffline(location.id).then(setIsOffline);
  }, [location.id]);

  const handleDownload = async () => {
    if (!location || !spots) return;
    setIsDownloading(true);
    toast({ title: 'Mengunduh...', description: `Konten untuk ${location.name} sedang disimpan untuk mode offline.` });
    try {
      await saveLocationForOffline(location, spots);
      setIsOffline(true);
      toast({ title: 'Berhasil!', description: `${location.name} telah tersedia untuk mode offline.` });
    } catch (error) {
      console.error('Failed to save for offline:', error);
      toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menyimpan konten untuk mode offline.' });
    } finally {
      setIsDownloading(false);
    }
  };
  
  const sortedSpots = spots ? [...spots].sort((a, b) => a.order - b.order) : [];

  const handleStartMission = () => {
    // No longer forces login. Directly navigates to the first spot.
    if (sortedSpots.length > 0) {
      router.push(`/spot/${sortedSpots[0].id}`);
    } else {
      toast({
        variant: 'destructive',
        title: 'Misi Tidak Tersedia',
        description: 'Tidak ada spot yang ditemukan di lokasi ini untuk memulai misi.',
      });
    }
  };
  
  const role = userProfile?.role || 'free';
  const showAds = role === 'free';
  
  return (
    <div className="container mx-auto min-h-screen max-w-5xl p-4 md:p-8">
      <header className="mb-8">
        <Button variant="ghost" asChild className="mb-4 -ml-4">
          <Link href="/">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Lokasi
          </Link>
        </Button>
        <div className="relative h-64 w-full overflow-hidden rounded-lg shadow-xl">
          <Image src={location.coverImage} alt={location.name} fill className="object-cover" data-ai-hint="cave landscape" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          <h1 className="font-headline absolute bottom-4 left-4 text-3xl font-bold text-white md:text-4xl">
            {location.name}
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
        {!location.isActive && (
            <Alert variant="destructive" className="mb-8 bg-yellow-900/20 border-yellow-700/50 text-yellow-200">
                <Info className="h-4 w-4 !text-yellow-400" />
                <AlertTitle>Lokasi Tidak Aktif</AlertTitle>
                <AlertDescription>
                    Lokasi ini sedang tidak aktif dan tidak ditampilkan untuk umum. Anda dapat melihatnya karena memiliki akses admin atau tautan langsung.
                </AlertDescription>
            </Alert>
        )}

        <div className="mb-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold md:text-2xl">Misi Penjelajahan</h2>
              <p className="text-muted-foreground text-sm">Jelajahi setiap sudut di lokasi ini.</p>
            </div>
            <div className='flex items-center gap-2 flex-wrap'>
                <Button onClick={handleStartMission} size="lg" disabled={!location.isActive && role !== 'admin'}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Mulai Misi
                </Button>
                {(user && (role.startsWith('pro') || role === 'vip' || role === 'admin')) && (
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
                              <p>{isOffline ? 'Konten lokasi ini sudah bisa diakses offline.' : 'Unduh semua spot di lokasi ini untuk akses offline.'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
        </div>

        {showAds && location.isActive && (
            <div className="my-8">
                <AdBanner />
                <p className="text-center text-xs text-muted-foreground mt-2">
                    Nikmati pengalaman bebas iklan dengan <Link href="/pricing" className="underline text-primary">upgrade ke PRO</Link>.
                </p>
            </div>
        )}

        <h3 className="text-lg font-semibold md:text-xl mb-4 mt-8">Daftar Spot</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedSpots.map((spot, index) => {
            const isLocked = spot.isPro && !(user && (role.startsWith('pro') || role === 'vip' || role === 'admin'));
            const lockedMessage = user ? "Upgrade level PRO atau VIP Anda untuk mengakses spot ini." : "Login atau daftar untuk mengakses konten PRO.";
            return <SpotCard 
                      key={spot.id} 
                      spot={spot} 
                      isLocked={isLocked} 
                      isOffline={isOffline}
                      lockedMessage={lockedMessage} 
                   />;
          })}
           {sortedSpots.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">Belum ada spot yang ditambahkan untuk lokasi ini.</p>}
        </div>
      </main>
    </div>
  );
}
