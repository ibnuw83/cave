
'use client';

import KioskClient from "./client";
import { Location } from "@/lib/types";
import { useState, useEffect } from "react";
import { getLocations } from "@/lib/firestore-client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

// This page now acts as a client-side container that fetches the initial data needed by the KioskClient.
// This aligns with the client-side data fetching pattern used across the app.
export default function KioskSettingsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    getLocations(true) // Fetch all locations, including inactive ones for the admin
      .then(setLocations)
      .catch(() => {
        toast({
          variant: "destructive",
          title: "Gagal Memuat",
          description: "Tidak dapat mengambil daftar lokasi untuk pengaturan kios.",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Pengaturan Aplikasi</h1>
        <p className="text-muted-foreground">Kelola pengaturan umum aplikasi dan mode kios.</p>
      </header>
      <div className="space-y-8">
        {loading ? (
           <div className="space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <KioskClient 
            initialLocations={locations}
          />
        )}
      </div>
    </div>
  );
}
