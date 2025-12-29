
'use client';

import LocationsClient from "./client";
import { useRouter } from "next/navigation";
import type { Location } from "@/lib/types";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";

export default function LocationsPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLocations = useCallback(async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/admin/locations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Gagal mengambil data lokasi.');
      const data = await response.json();
      setLocations(data);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Gagal Memuat', description: error.message });
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [auth.currentUser, toast]);

  useEffect(() => {
    if (auth.currentUser) {
        fetchLocations();
    }
  }, [auth.currentUser, fetchLocations]);


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
                onEdit={handleEdit}
                onAdd={handleAdd}
                onDataChange={fetchLocations}
            />
        )}
    </div>
  );
}
