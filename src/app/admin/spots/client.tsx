
'use client';

import { useState, useMemo, useEffect } from 'react';
import { collection } from 'firebase/firestore';
import { Location, Spot } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteSpot } from "@/lib/firestore-client";
import { SpotForm } from "./spot-form";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

interface SpotsClientProps {
  locations: Location[];
}

export default function SpotsClient({ locations }: SpotsClientProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [filterLocationId, setFilterLocationId] = useState<string>('all');
  const { toast } = useToast();
  const firestore = useFirestore();

  const spotsQuery = useMemoFirebase(() => collection(firestore, 'spots'), [firestore]);
  const { data: spots, isLoading: spotsLoading } = useCollection<Spot>(spotsQuery);

  const handleFormSuccess = () => {
    if (selectedSpot) {
      toast({ title: "Berhasil", description: "Spot berhasil diperbarui." });
    } else {
      toast({ title: "Berhasil", description: "Spot baru berhasil ditambahkan." });
    }
    setIsFormOpen(false);
    setSelectedSpot(null);
  };

  const openForm = (spot: Spot | null) => {
    setSelectedSpot(spot);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteSpot(id);
    toast({ title: "Berhasil", description: "Spot berhasil dihapus." });
  };

  const filteredSpots = useMemo(() => {
    if (!spots) {
      return [];
    }
    const spotsToSort = [...spots];
    if (filterLocationId === 'all') {
      return spotsToSort.sort((a, b) => a.order - b.order);
    }
    const filtered = spotsToSort.filter((spot) => spot.locationId === filterLocationId);
    return filtered.sort((a, b) => a.order - b.order);
  }, [spots, filterLocationId]);


  const getLocationName = (locationId: string) => {
    return locations.find(l => l.id === locationId)?.name || 'Lokasi tidak ditemukan';
  };

  if (isFormOpen) {
    return <SpotForm spot={selectedSpot} locations={locations} allSpots={spots || []} onSave={handleFormSuccess} onCancel={() => { setIsFormOpen(false); setSelectedSpot(null); }} />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-2">
        <Select value={filterLocationId} onValueChange={setFilterLocationId}>
          <SelectTrigger className="w-full md:w-[280px]">
            <SelectValue placeholder="Filter berdasarkan lokasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Lokasi</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => openForm(null)}>
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden md:inline">Tambah Spot</span>
        </Button>
      </div>

      {spotsLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
      <div className="space-y-4">
        {filteredSpots.map((spot) => (
          <Card key={spot.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{spot.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <span className="text-xs">{getLocationName(spot.locationId)}</span>
                    {spot.isPro && <Badge>PRO</Badge>}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => openForm(spot)}>
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
                        <AlertDialogTitle>Anda yakin ingin menghapus spot ini?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Aksi ini akan menghapus spot "{spot.title}". Aksi ini tidak dapat diurungkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(spot.id)}>Hapus</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
         {filteredSpots.length === 0 && <p className="text-center text-muted-foreground pt-8">Belum ada spot untuk lokasi ini.</p>}
      </div>
      )}
    </div>
  );
}
