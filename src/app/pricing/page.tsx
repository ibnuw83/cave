
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useUser, useFirestore } from '@/firebase';
import { getPricingTiers as getPricingTiersClient } from '@/lib/firestore-client';
import { PricingTier } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';


export default function PricingPage() {
    const { userProfile } = useUser();
    const [tiers, setTiers] = useState<PricingTier[]>([]);
    const [loading, setLoading] = useState(true);
    const db = useFirestore();

    useEffect(() => {
        getPricingTiersClient(db).then(data => {
            setTiers(data);
            setLoading(false);
        }).catch(err => {
            console.error("Failed to fetch pricing tiers:", err);
            setLoading(false);
        });
    }, [db]);

    const currentRole = userProfile?.role || 'free';

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                     <div className="text-center">
                        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">
                            Pilih Paket Petualangan Anda
                        </h1>
                        <p className="mt-4 text-xl text-muted-foreground">
                            Buka akses ke lebih banyak keajaiban tersembunyi dengan paket yang sesuai untuk Anda.
                        </p>
                    </div>
                    <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        {[...Array(5)].map((_, i) => (
                             <Card key={i} className="flex flex-col">
                                <CardHeader>
                                    <Skeleton className="h-6 w-3/5" />
                                    <Skeleton className="h-4 w-4/5" />
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <Skeleton className="h-10 w-1/2 mb-6" />
                                    <div className="space-y-4">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Skeleton className="h-10 w-full" />
                                </CardFooter>
                             </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    
    if (!tiers.length) {
         return (
            <div className="flex h-screen items-center justify-center text-center">
                <div>
                    <h2 className="text-2xl font-semibold">Paket Tidak Ditemukan</h2>
                    <p className="text-muted-foreground mt-2">
                        Sepertinya belum ada paket harga yang dikonfigurasi.
                    </p>
                    {userProfile?.role === 'admin' && (
                        <Button asChild className="mt-4">
                            <Link href="/admin/pricing">Konfigurasi Paket Sekarang</Link>
                        </Button>
                    )}
                </div>
            </div>
        );
    }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">
            Pilih Paket Petualangan Anda
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Buka akses ke lebih banyak keajaiban tersembunyi dengan paket yang sesuai untuk Anda.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={cn(
                'flex flex-col border-border/50 transition-all duration-300',
                tier.isPopular ? 'border-primary shadow-primary/20 shadow-2xl scale-105' : 'hover:border-primary/50 hover:-translate-y-2'
              )}
            >
              <CardHeader className="relative">
                {tier.isPopular && (
                  <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                    <div className="inline-flex items-center gap-x-2 rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground">
                      <Star className="h-4 w-4" />
                      Paling Populer
                    </div>
                  </div>
                )}
                <CardTitle className="pt-4 font-headline text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.priceDescription}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mb-6">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  {tier.name !== 'Free' && tier.name !== 'VIP' && <span className="text-muted-foreground"> /bulan</span>}
                </div>
                <ul className="space-y-4 text-sm">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="mr-3 h-5 w-5 flex-shrink-0 text-green-400" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                 <Button className="w-full" asChild variant={tier.id === currentRole ? 'outline' : 'default'} disabled={tier.id === currentRole}>
                    <Link href={tier.id === currentRole ? '#' : `/pembayaran?tier=${tier.id}`}>
                        {tier.id === currentRole ? 'Paket Aktif' : tier.cta}
                    </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-16 text-center">
            <Button variant="ghost" asChild>
                <Link href="/">
                    Kembali ke Halaman Utama
                </Link>
            </Button>
        </div>
      </div>
    </div>
  );
}
