
'use client';

import { useRouter, useParams } from 'next/navigation';
import { Location } from '@/lib/types';
import { LocationForm } from '../location-form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';

export default function LocationEditPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { userProfile } = useUser();
  const firestore = useFirestore();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const isNew = id === 'new';

  const locationRef = userProfile?.role === 'admin' && !isNew ? doc(firestore, 'locations', id) : null;
  const { data: location, isLoading: loading } = useDoc<Location>(locationRef);

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
