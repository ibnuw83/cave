
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Location, Spot } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { SpotForm } from "./spot-form";
import { useUser, useAuth } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function SpotsClient() {
  const { userProfile } = useUser();
  const auth = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [filterLocationId, setFilterLocationId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
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
      if (!locsRes.ok || !spotsRes.ok) throw new Error("Failed to fetch initial data");
      
      const locsData = await locsRes.json();
      const spotsData = await spotsRes.json();

      setLocations(locsData);
      setSpots(spotsData);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal memuat ulang data.' });
    } finally {
      setLoading(false);
    }
  }, [auth.currentUser, toast]);

  useEffect(() => {
    if (!isFormOpen) {
        fetchData();
    }
  }, [isFormOpen, fetchData]);

  const handleFormSuccess = () => {
    toast({ title: "Berhasil", description: `Spot telah ${selectedSpot ? 'diperbarui' : 'ditambahkan'}.` });
    setIsFormOpen(false);
    setSelectedSpot(null);
    fetchData(); // Refresh data
  };

  const openForm = (spot: Spot | null) => {
    setSelectedSpot(spot);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`/api/admin/spots/${id}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus spot.');
      }
      toast({ title: "Berhasil", description: "Spot berhasil dihapus." });
      fetchData(); // Refresh data
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Gagal', description: error.message });
    }
  };

  const filteredSpots = useMemo(() => {
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

  if (userProfile?.role !== 'admin') {
    return (
      <p className="text-center text-muted-foreground py-12">
        Anda tidak memiliki akses ke halaman ini.
      </p>
    );
  }

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

      {loading ? (
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
