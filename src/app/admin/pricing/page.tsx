'use client';

import { useState, useEffect } from 'react';
import { PricingTier } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { deletePricingTier, getPricingTiers } from '@/lib/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { PricingTierForm } from './tier-form';
import { Badge } from '@/components/ui/badge';

export default function AdminPricingPage() {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTiers = () => {
      setLoading(true);
      getPricingTiers()
        .then(data => {
          setTiers(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };

    if (!isFormOpen) {
      fetchTiers();
    }
  }, [isFormOpen]);

  const handleFormSuccess = () => {
    toast({ title: 'Berhasil', description: `Paket harga telah ${selectedTier ? 'diperbarui' : 'ditambahkan'}.` });
    setIsFormOpen(false);
    setSelectedTier(null);
  };

  const openForm = (tier: PricingTier | null) => {
    setSelectedTier(tier);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePricingTier(id);
      setTiers(tiers.filter(t => t.id !== id));
      toast({ title: 'Berhasil', description: 'Paket harga berhasil dihapus.' });
    } catch (error) {
      // Error handled by global handler
    }
  };

  if (isFormOpen) {
    return (
      <div className="p-4 md:p-8">
        <PricingTierForm
          tier={selectedTier}
          onSave={handleFormSuccess}
          onCancel={() => {
            setIsFormOpen(false);
            setSelectedTier(null);
          }}
          allRoles={['free', 'pro1', 'pro2', 'pro3', 'vip']}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Manajemen Paket Harga</h1>
        <p className="text-muted-foreground">Kelola paket langganan yang ditampilkan di halaman harga.</p>
      </header>

      <div className="flex justify-end mb-4">
        <Button onClick={() => openForm(null)}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Paket
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {tiers.map(tier => (
            <Card key={tier.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-3">
                        {tier.name}
                        {tier.isPopular && <Badge>Populer</Badge>}
                    </CardTitle>
                    <CardDescription>
                      {tier.price} - {tier.priceDescription}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => openForm(tier)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {tier.id !== 'free' && (
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Anda yakin ingin menghapus?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Aksi ini akan menghapus paket "{tier.name}". Aksi ini tidak dapat diurungkan.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(tier.id)}>Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                    )}
                  </div>
                </div>
              </CardHeader>
               <CardContent>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {tier.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                        ))}
                    </ul>
              </CardContent>
            </Card>
          ))}
          {tiers.length === 0 && !loading && (
            <p className="text-center text-muted-foreground py-8">Belum ada paket harga yang dibuat.</p>
          )}
        </div>
      )}
    </div>
  );
}
