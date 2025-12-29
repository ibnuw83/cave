
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Location, Spot } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { SpotForm } from "./spot-form";
import { collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { useFirestore } from '@/app/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { getLocations } from '@/lib/firestore-client';

export default function SpotsClient() {
  const firestore = useFirestore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [filterLocationId, setFilterLocationId] = useState<string>('all');
  const { toast } = useToast();

  const [initialLocations, setInitialLocations] = useState<Location[]>([]);
  const [initialSpots, setInitialSpots] = useState<Spot[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [spotsLoading, setSpotsLoading] = useState(true);

  useEffect(() => {
    getLocations(firestore, true).then(data => {
      setInitialLocations(data);
      setLocationsLoading(false);
    });

    const spotsRef = collection(firestore, 'spots');
    const unsubscribe = onSnapshot(spotsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Spot));
      setInitialSpots(data);
      setSpotsLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);


  const handleFormSuccess = () => {
    toast({ title: "Berhasil", description: `Spot telah ${selectedSpot ? 'diperbarui' : 'ditambahkan'}.` });
    setIsFormOpen(false);
    setSelectedSpot(null);
  };

  const openForm = (spot: Spot | null) => {
    setSelectedSpot(spot);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(firestore, 'spots', id));
      toast({ title: "Berhasil", description: "Spot berhasil dihapus." });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Gagal', description: error.message });
    }
  };

  const filteredSpots = useMemo(() => {
    if (!initialSpots) return [];
    const spotsToSort = [...initialSpots];
    if (filterLocationId === 'all') {
      return spotsToSort.sort((a, b) => a.order - b.order);
    }
    const filtered = spotsToSort.filter((spot) => spot.locationId === filterLocationId);
    return filtered.sort((a, b) => a.order - b.order);
  }, [initialSpots, filterLocationId]);


  const getLocationName = (locationId: string) => {
    if (!initialLocations) return 'Memuat...';
    return initialLocations.find(l => l.id === locationId)?.name || 'Lokasi tidak ditemukan';
  };

  if (locationsLoading || spotsLoading) {
      return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4 gap-2">
                <Skeleton className="h-10 w-full md:w-[280px]" />
                <Skeleton className="h-10 w-28 md:w-36" />
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
      );
  }

  if (isFormOpen) {
    return <SpotForm spot={selectedSpot} locations={initialLocations || []} allSpots={initialSpots || []} onSave={handleFormSuccess} onCancel={() => { setIsFormOpen(false); setSelectedSpot(null); }} />;
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
            {(initialLocations || []).map((location) => (
              <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => openForm(null)}>
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden md:inline">Tambah Spot</span>
        </Button>
      </div>

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
    </div>
  );
}
