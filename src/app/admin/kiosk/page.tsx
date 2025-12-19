
'use client';

import { getCaves } from "@/lib/firestore";
import KioskClient from "./client";
import { Cave } from "@/lib/types";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function KioskSettingsPage() {
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
        <h1 className="text-2xl md:text-3xl font-bold">Pengaturan Aplikasi</h1>
        <p className="text-muted-foreground">Kelola pengaturan umum dan mode kios.</p>
      </header>
      <div className="space-y-8">
        {loading ? (
           <div className="space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : (
          <KioskClient 
            initialCaves={caves}
          />
        )}
      </div>
    </div>
  );
}
