
'use client';

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import ArtifactsClient from "./client";
import { Cave, Spot } from "@/lib/types";
import { getCaves, getAllSpotsForAdmin } from "@/lib/firestore";

export default function ArtifactsPage() {
  const [caves, setCaves] = useState<Cave[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
        getCaves(true),
        getAllSpotsForAdmin()
    ]).then(([cavesData, spotsData]) => {
      setCaves(cavesData);
      setSpots(spotsData);
      setLoading(false);
    });
  }, []);


  return (
    <div className="p-4 md:p-8">
       <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Manajemen Artefak</h1>
        <p className="text-muted-foreground">Kelola semua 'harta karun' yang dapat ditemukan.</p>
      </header>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <ArtifactsClient initialCaves={caves} initialSpots={spots} />
      )}
    </div>
  );
}

    