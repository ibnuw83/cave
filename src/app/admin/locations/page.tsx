
'use client';

import LocationsClient from "./client";
import { Location } from "@/lib/types";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useAuth } from "@/firebase";

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();

  const refreshLocations = useCallback(async () => {
    if (!auth.currentUser) {
        // This case is handled by the layout, but as a safeguard:
        toast({ variant: 'destructive', title: 'Gagal', description: 'Anda harus login untuk memuat lokasi.' });
        setLoading(false);
        return;
    }

    setLoading(true);
    try {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch('/api/admin/locations', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Gagal mengambil data lokasi dari server.');
        const data = await response.json();
        setLocations(data);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Gagal Memuat', description: error.message });
    } finally {
        setLoading(false);
    }
  }, [auth.currentUser, toast]);

  useEffect(() => {
    // Fetch data only when user is available
    if (auth.currentUser) {
        refreshLocations();
    }
  }, [auth.currentUser, refreshLocations]);

  const handleEdit = (location: Location) => {
    router.push(`/admin/locations/${location.id}`);
  };

  const handleAdd = () => {
    router.push('/admin/locations/new');
  }

  return (
    <div className="p-4 md:p-8">
       <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Manajemen Lokasi</h1>
        <p className="text-muted-foreground">Kelola semua data lokasi seperti gua dan situs sejarah.</p>
      </header>
       {loading ? (
         <div className="space-y-4">
            <div className="flex justify-end mb-4">
                <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
       ) : (
        <LocationsClient 
            initialLocations={locations} 
            onDataChange={refreshLocations} 
            onEdit={handleEdit}
            onAdd={handleAdd}
        />
       )}
    </div>
  );
}
