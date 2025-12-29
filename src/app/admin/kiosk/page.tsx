
'use client';

import KioskClient from "./client";
import { Location } from "@/lib/types";
import { useState, useEffect } from "react";
import { getLocations } from "@/lib/firestore-client";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirestore } from "@/app/layout";


export default function KioskSettingsPage() {
  const firestore = useFirestore();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Fetch all locations, including inactive ones for the admin
    getLocations(firestore, true).then(data => {
      setLocations(data);
      setIsLoading(false);
    });
  }, [firestore]);
  

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Pengaturan Aplikasi</h1>
        <p className="text-muted-foreground">Kelola pengaturan umum aplikasi dan mode kios.</p>
      </header>
      <div className="space-y-8">
        {isLoading ? (
           <div className="space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <KioskClient 
            initialLocations={locations || []}
          />
        )}
      </div>
    </div>
  );
}
