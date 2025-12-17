'use client';

import { Cave, Spot } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, ChevronLeft, Zap, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function SpotCard({ spot, isLocked }: { spot: Spot; isLocked: boolean }) {
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

export default function CaveClient({ cave, spots }: { cave: Cave; spots: Spot[];}) {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl p-4 md:p-8">
        <Skeleton className="h-8 w-32 mb-8" />
        <Skeleton className="h-48 w-full mb-6" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const role = userProfile?.role || 'free';

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
        </div>
      </header>

      <main>
        <h2 className="mb-6 text-xl font-semibold md:text-2xl">Spot Penjelajahan</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {spots.map((spot) => (
            <SpotCard key={spot.id} spot={spot} isLocked={spot.isPro && role === 'free'} />
          ))}
        </div>
      </main>
    </div>
  );
}
