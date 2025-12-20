
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Crown, Gem, Star, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

const tiers = [
  {
    name: 'Free',
    price: 'Gratis',
    priceDescription: 'Untuk memulai petualangan',
    features: [
      'Akses 1 spot per kategori lokasi',
      'Tampilan 360° standar',
      'Dukungan Komunitas',
    ],
    isPopular: false,
    cta: 'Paket Anda Saat Ini',
    role: 'free'
  },
  {
    name: 'PRO 1',
    price: 'Rp 15k',
    priceDescription: 'Untuk penjelajah pemula',
    features: [
      'Akses hingga 5 spot per kategori',
      'Narasi Audio AI',
      'Pengalaman 4D (Getaran)',
      'Akses Offline',
    ],
    isPopular: false,
    cta: 'Pilih PRO 1',
    role: 'pro1'
  },
    {
    name: 'PRO 2',
    price: 'Rp 25k',
    priceDescription: 'Untuk petualang sejati',
    features: [
      'Akses hingga 10 spot per kategori',
      'Semua fitur PRO 1',
      'Kualitas gambar lebih tinggi',
      'Dukungan Prioritas',
    ],
    isPopular: true,
    cta: 'Pilih PRO 2',
    role: 'pro2'
  },
  {
    name: 'PRO 3',
    price: 'Rp 35k',
    priceDescription: 'Untuk kolektor pengalaman',
    features: [
      'Akses hingga 15 spot per kategori',
      'Semua fitur PRO 2',
      'Akses awal ke lokasi baru',
    ],
    isPopular: false,
    cta: 'Pilih PRO 3',
    role: 'pro3'
  },
  {
    name: 'VIP',
    price: 'Hubungi Kami',
    priceDescription: 'Untuk akses tanpa batas',
    features: [
      'Akses ke semua spot tanpa batas',
      'Semua fitur PRO 3',
      'Lisensi untuk penggunaan komersial',
      'Manajer Akun Khusus',
    ],
    isPopular: false,
    cta: 'Hubungi Sales',
    role: 'vip'
  },
];

export default function PricingPage() {
    const { userProfile } = useUser();
    const currentRole = userProfile?.role || 'free';

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
                 <Button className="w-full" asChild variant={tier.role === currentRole ? 'outline' : 'default'} disabled={tier.role === currentRole}>
                    <Link href={tier.role === currentRole ? '#' : '/pembayaran'}>
                        {tier.role === currentRole ? 'Paket Aktif' : tier.cta}
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
