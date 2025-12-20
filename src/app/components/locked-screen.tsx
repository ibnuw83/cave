'use client';

import { Spot } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Lock, ArrowLeft, Gem } from 'lucide-react';
import placeholderImages from '@/lib/placeholder-images.json';

export default function LockedScreen({ spot }: { spot: Spot }) {
  const bgImage = placeholderImages.placeholderImages.find(img => img.id === 'locked-screen-background')?.imageUrl || spot.imageUrl;
  
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <Image
        src={bgImage}
        alt={spot.title}
        fill
        className="object-cover z-0"
        quality={100}
        data-ai-hint="blurry cave"
      />
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-10"></div>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-20 text-white">
        <Lock className="h-16 w-16 text-accent mb-6" />
        <h1 className="text-3xl font-bold font-headline mb-2">Spot Khusus PRO</h1>
        <p className="max-w-md text-lg text-white/80 mb-8">
          Upgrade akun Anda ke PRO untuk mengakses spot eksklusif ini dan semua fitur premium lainnya.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" asChild>
            <Link href="/pricing">
                <Gem className="mr-2 h-5 w-5" />
                Upgrade ke PRO
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground" asChild>
            <Link href={`/cave/${spot.locationId}`}>
              <ArrowLeft className="mr-2 h-5 w-5" />
              Kembali ke Lokasi
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
