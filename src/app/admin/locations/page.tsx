
'use client';

import LocationsClient from "./client";
import { useRouter } from "next/navigation";
import type { Location } from "@/lib/types";

export default function LocationsPage() {
  const router = useRouter();

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
        <LocationsClient 
            onEdit={handleEdit}
            onAdd={handleAdd}
        />
    </div>
  );
}
