
'use client';

import { useRouter, useParams } from 'next/navigation';
import { Location } from '@/lib/types';
import { LocationForm } from '../location-form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useUser } from '@/app/layout';
import { useEffect, useState } from 'react';
import { getLocationClient } from '@/lib/firestore-client';

export default function LocationEditPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { userProfile } = useUser();
  const firestore = useFirestore();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const isNew = id === 'new';

  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if(userProfile?.role === 'admin' && !isNew) {
      getLocationClient(firestore, id).then(data => {
        setLocation(data);
        setLoading(false);
      });
    }
  }, [userProfile, isNew, firestore, id]);


  const handleSave = () => {
    toast({ title: 'Berhasil', description: `Lokasi telah ${isNew ? 'dibuat' : 'diperbarui'}.` });
    router.push('/admin/locations');
  };

  const handleCancel = () => {
    router.push('/admin/locations');
  };

  if (loading && !isNew) {
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
        location={isNew ? null : location} 
        onSave={handleSave} 
        onCancel={handleCancel} 
      />
    </div>
  );
}
