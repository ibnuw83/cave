
'use client';

import SpotsClient from "./client";
import { Location, Spot } from "@/lib/types";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/firebase";

// This page now acts as a container that fetches all required data
// and passes it down to the client component.
export default function SpotsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const auth = useAuth();

  const fetchData = useCallback(async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const headers = { 'Authorization': `Bearer ${token}` };

      const [locsRes, spotsRes] = await Promise.all([
        fetch('/api/admin/locations', { headers }),
        fetch('/api/admin/spots', { headers })
      ]);
      if (!locsRes.ok || !spotsRes.ok) throw new Error("Gagal mengambil data awal dari server.");
      
      const locsData = await locsRes.json();
      const spotsData = await spotsRes.json();

      setLocations(locsData);
      setSpots(spotsData);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Gagal Memuat', description: e.message });
    } finally {
      setLoading(false);
    }
  }, [auth.currentUser, toast]);

  useEffect(() => {
    if (auth.currentUser) {
      fetchData();
    }
  }, [auth.currentUser, fetchData]);


  return (
    <div className="p-4 md:p-8">
       <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Manajemen Spot</h1>
        <p className="text-muted-foreground">Kelola semua spot penjelajahan.</p>
      </header>
      {loading ? (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4 gap-2">
                <Skeleton className="h-10 w-full md:w-[280px]" />
                <Skeleton className="h-10 w-28 md:w-36" />
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <SpotsClient 
            initialLocations={locations}
            initialSpots={spots}
            onDataChange={fetchData}
        />
      )}
    </div>
  );
}
