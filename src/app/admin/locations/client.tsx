
'use client';

import { useState, useMemo, useEffect } from "react";
import { Location } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteLocation, addLocation, updateLocation } from "@/lib/firestore-admin-api";
import { LocationForm } from "./location-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/firebase";

export default function LocationsClient({ initialLocations }: { initialLocations: Location[] }) {
  const { userProfile } = useUser();
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const { toast } = useToast();

  const sortedLocations = useMemo(() => {
    return [...locations].sort((a,b) => a.name.localeCompare(b.name));
  }, [locations]);

  const refreshLocations = async () => {
    setLoading(true);
    try {
        const response = await fetch('/api/admin/locations');
        if (!response.ok) throw new Error('Failed to fetch locations');
        const data = await response.json();
        setLocations(data);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal memuat ulang data lokasi.' });
    } finally {
        setLoading(false);
    }
  }

  const handleFormSuccess = () => {
    if (selectedLocation) {
      toast({ title: "Berhasil", description: "Lokasi berhasil diperbarui." });
    } else {
      toast({ title: "Berhasil", description: "Lokasi baru berhasil ditambahkan." });
    }
    setIsFormOpen(false);
    setSelectedLocation(null);
    refreshLocations(); // Refresh data after save
  };

  const openForm = (location: Location | null) => {
    setSelectedLocation(location);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
        await deleteLocation(id);
        toast({ title: "Berhasil", description: "Lokasi dan semua spot di dalamnya berhasil dihapus." });
        refreshLocations();
    } catch (error) {
        // Error is handled by the API route and toast is shown there
    }
  };

  if (userProfile?.role !== 'admin') {
    return (
      <p className="text-center text-muted-foreground py-12">
        Anda tidak memiliki akses ke halaman ini.
      </p>
    );
  }
  
  if (isFormOpen) {
    return <LocationForm location={selectedLocation} onSave={handleFormSuccess} onCancel={() => { setIsFormOpen(false); setSelectedLocation(null); }} />;
  }
  
  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => openForm(null)}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Lokasi
        </Button>
      </div>

       {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
            {sortedLocations.map((location) => (
            <Card key={location.id}>
                <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                    <CardTitle className="text-lg">{location.name}</CardTitle>
                    <CardDescription>
                        <Badge variant={location.isActive ? "default" : "secondary"}>
                            {location.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                         <Badge variant="outline" className="ml-2">{location.category}</Badge>
                    </CardDescription>
                    </div>
                    <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => openForm(location)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Anda yakin ingin menghapus?</AlertDialogTitle>
                            <AlertDialogDescription>
                            Aksi ini akan menghapus lokasi "{location.name}" dan semua spot di dalamnya. Aksi ini tidak dapat diurungkan.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(location.id)}>Hapus</AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    </div>
                </div>
                </CardHeader>
            </Card>
            ))}
            {sortedLocations.length === 0 && !loading && <p className="text-center text-muted-foreground py-8">Belum ada lokasi.</p>}
        </div>
      )}
    </div>
  );
}
