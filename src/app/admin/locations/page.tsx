'use client';

import LocationsClient from "./client";
import { Location } from "@/lib/types";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const refreshLocations = async () => {
    setLoading(true);
    try {
        const response = await fetch('/api/admin/locations');
        if (!response.ok) throw new Error('Failed to fetch locations');
        const data = await response.json();
        setLocations(data);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal memuat data lokasi.' });
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => {
    refreshLocations();
  }, []);

  return (
    <div className="p-4 md:p-8">
       <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Manajemen Lokasi</h1>
        <p className="text-muted-foreground">Kelola semua data lokasi seperti gua dan situs sejarah.</p>
      </header>
       {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <LocationsClient initialLocations={locations} onDataChange={refreshLocations} />
      )}
    </div>
  );
}
