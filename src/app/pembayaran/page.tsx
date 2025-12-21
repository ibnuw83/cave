
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { useUser } from '@/firebase';
import { getPricingTiers, updateUserRole } from '@/lib/firestore-client';
import { PricingTier, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

function PembayaranComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [tier, setTier] = useState<PricingTier | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const tierId = searchParams.get('tier');

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    if (!tierId) {
      toast({ variant: 'destructive', title: 'Paket tidak valid', description: 'Silakan pilih paket dari halaman harga.' });
      router.push('/pricing');
      return;
    }

    setLoading(true);
    getPricingTiers()
      .then(tiers => {
        const selectedTier = tiers.find(t => t.id === tierId);
        if (selectedTier) {
          setTier(selectedTier);
        } else {
          toast({ variant: 'destructive', title: 'Paket tidak ditemukan' });
          router.push('/pricing');
        }
      })
      .catch(() => {
        toast({ variant: 'destructive', title: 'Gagal memuat paket' });
        router.push('/pricing');
      })
      .finally(() => setLoading(false));

  }, [tierId, router, toast, user, isUserLoading]);

  const handleSimulatePayment = async () => {
    if (!user || !tier) return;

    setIsProcessing(true);
    try {
      await updateUserRole(user.uid, tier.id as UserProfile['role']);
      toast({
        title: 'Pembayaran Berhasil!',
        description: `Anda sekarang adalah pengguna ${tier.name}.`,
      });
      router.push('/profile');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Pembayaran Gagal',
        description: 'Terjadi kesalahan saat memperbarui status akun Anda.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading || isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/5" />
              <Skeleton className="h-4 w-4/5" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }
  
  if (!tier) {
    // This state is usually brief before redirection happens in useEffect
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-screen max-w-md items-center justify-center p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Konfirmasi Pembayaran</CardTitle>
          <CardDescription>Anda akan meng-upgrade ke paket berikut:</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-muted p-4">
            <h3 className="text-2xl font-bold font-headline text-primary">{tier.name}</h3>
            <p className="text-3xl font-bold">{tier.price}</p>
            <p className="text-sm text-muted-foreground">{tier.priceDescription}</p>
          </div>
           <div>
            <h4 className="font-semibold mb-2">Fitur Termasuk:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {tier.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                ))}
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button className="w-full" onClick={handleSimulatePayment} disabled={isProcessing}>
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Simulasikan Pembayaran Berhasil
          </Button>
           <Button variant="ghost" asChild className="w-full">
            <Link href="/pricing">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Pilih Paket Lain
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}


export default function PembayaranPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        }>
            <PembayaranComponent />
        </Suspense>
    )
}
