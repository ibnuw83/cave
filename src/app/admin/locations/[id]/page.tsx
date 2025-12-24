
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Location } from '@/lib/types';
import { LocationForm } from '../location-form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function LocationEditPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);

  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const isNew = id === 'new';

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }

    async function fetchLocation() {
      try {
        // Fetch a single location by its ID
        const response = await fetch(`/api/admin/locations/${id}`);
        if (!response.ok) {
            if (response.status === 404) {
                toast({ variant: 'destructive', title: 'Tidak Ditemukan', description: `Lokasi dengan ID ${id} tidak ada.` });
                router.push('/admin/locations');
            } else {
                throw new Error('Gagal mengambil data lokasi');
            }
            return;
        }
        const loc = await response.json();
        setLocation(loc);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal Memuat', description: 'Gagal mengambil data lokasi.' });
      } finally {
        setLoading(false);
      }
    }

    fetchLocation();
  }, [id, isNew, router, toast]);

  const handleSave = () => {
    toast({ title: 'Berhasil', description: `Lokasi telah ${isNew ? 'dibuat' : 'diperbarui'}.` });
    router.push('/admin/locations');
    router.refresh(); // Force a refresh to update the list
  };

  const handleCancel = () => {
    router.push('/admin/locations');
  };

  if (loading) {
    return (
        <div className="p-4 md:p-8">
            <header className="mb-8">
                <Skeleton className="h-9 w-48 mb-2" />
                <Skeleton className="h-5 w-64" />
            </header>
            <div className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                 <div className="flex justify-end">
                    <Skeleton className="h-10 w-24" />
                 </div>
            </div>
        </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <LocationForm 
        location={location} 
        onSave={handleSave} 
        onCancel={handleCancel} 
      />
    </div>
  );
}
