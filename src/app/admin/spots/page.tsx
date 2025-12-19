'use client';

import { getCaves } from "@/lib/firestore";
import SpotsClient from "./client";
import { Cave } from "@/lib/types";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SpotsPage() {
  const [caves, setCaves] = useState<Cave[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCaves(true).then(c => {
      setCaves(c);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-4 md:p-8">
       <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Manajemen Spot</h1>
        <p className="text-muted-foreground">Kelola semua spot penjelajahan.</p>
      </header>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <SpotsClient caves={caves} />
      )}
    </div>
  );
}
