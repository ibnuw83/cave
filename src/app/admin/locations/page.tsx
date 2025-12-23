
'use client';

import LocationsClient from "./client";
import { Location } from "@/lib/types";
import { useEffect, useState, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "next/navigation";
import { LocationForm } from "./location-form";

function LocationsPageContent() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const editId = searchParams.get('edit');

  const refreshLocations = async () => {
    setLoading(true);
    try {
        const response = await fetch('/api/admin/locations');
        if (!response.ok) throw new Error('Failed to fetch locations');
        const data = await response.json();
        setLocations(data);

        // if an editId is present, find the location and open the form
        if (editId) {
            const locToEdit = data.find((l: Location) => l.id === editId);
            if (locToEdit) {
                setSelectedLocation(locToEdit);
                setIsFormOpen(true);
            } else {
                 toast({ variant: 'destructive', title: 'Gagal', description: `Lokasi dengan ID ${editId} tidak ditemukan.` });
            }
        } else {
            setIsFormOpen(false);
            setSelectedLocation(null);
        }

    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal memuat data lokasi.' });
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => {
    refreshLocations();
  }, [editId]);


  const handleFormSuccess = () => {
    if (selectedLocation) {
      toast({ title: "Berhasil", description: "Lokasi berhasil diperbarui." });
    } else {
      toast({ title: "Berhasil", description: "Lokasi baru berhasil ditambahkan." });
    }
    setIsFormOpen(false);
    setSelectedLocation(null);
    refreshLocations();
     // remove a query param to be able to click on the same link again
    window.history.replaceState({}, '', '/admin/locations');
  };

  const handleOpenForm = (location: Location | null) => {
    setSelectedLocation(location);
    setIsFormOpen(true);
  };
  
  const handleCancelForm = () => {
     setIsFormOpen(false);
     setSelectedLocation(null);
     // remove a query param to be able to click on the same link again
     window.history.replaceState({}, '', '/admin/locations');
  }


  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  
  if (isFormOpen) {
    return <LocationForm location={selectedLocation} onSave={handleFormSuccess} onCancel={handleCancelForm} />;
  }

  return (
      <LocationsClient 
        initialLocations={locations} 
        onDataChange={refreshLocations} 
        onEdit={handleOpenForm}
        onAdd={() => handleOpenForm(null)}
        />
  );
}


export default function LocationsPage() {
  return (
    <div className="p-4 md:p-8">
       <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Manajemen Lokasi</h1>
        <p className="text-muted-foreground">Kelola semua data lokasi seperti gua dan situs sejarah.</p>
      </header>
       <Suspense fallback={<div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>}>
        <LocationsPageContent />
       </Suspense>
    </div>
  );
}
