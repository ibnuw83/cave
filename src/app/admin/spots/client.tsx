'use client';

import { useState, useMemo } from 'react';
import { Cave, Spot } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteSpot } from "@/lib/firestore";
import { SpotForm } from "./spot-form";

export default function SpotsClient({ initialSpots, caves }: { initialSpots: Spot[]; caves: Cave[] }) {
  const [spots, setSpots] = useState(initialSpots);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [filterCaveId, setFilterCaveId] = useState<string>('all');
  const { toast } = useToast();

  const handleFormSuccess = (spot: Spot) => {
    if (selectedSpot) {
      setSpots(spots.map((s) => (s.id === spot.id ? spot : s)));
      toast({ title: "Berhasil", description: "Spot berhasil diperbarui." });
    } else {
      setSpots([...spots, spot]);
      toast({ title: "Berhasil", description: "Spot baru berhasil ditambahkan." });
    }
    setIsFormOpen(false);
    setSelectedSpot(null);
  };

  const openForm = (spot: Spot | null) => {
    setSelectedSpot(spot);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSpot(id);
      setSpots(spots.filter((s) => s.id !== id));
      toast({ title: "Berhasil", description: "Spot berhasil dihapus." });
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat menghapus spot." });
    }
  };

  const filteredSpots = useMemo(() => {
    if (filterCaveId === 'all') {
      return spots;
    }
    return spots.filter((spot) => spot.caveId === filterCaveId);
  }, [spots, filterCaveId]);

  if (isFormOpen) {
    return <SpotForm spot={selectedSpot} caves={caves} onSave={handleFormSuccess} onCancel={() => { setIsFormOpen(false); setSelectedSpot(null); }} />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-2">
        <Select value={filterCaveId} onValueChange={setFilterCaveId}>
          <SelectTrigger className="w-full md:w-[280px]">
            <SelectValue placeholder="Filter berdasarkan gua" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Gua</SelectItem>
            {caves.map((cave) => (
              <SelectItem key={cave.id} value={cave.id}>{cave.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => openForm(null)}>
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden md:inline">Tambah Spot</span>
        </Button>
      </div>

      <div className="space-y-4">
        {filteredSpots.sort((a, b) => a.order - b.order).map((spot) => (
          <Card key={spot.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{spot.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <span className="text-xs">{caves.find(c => c.id === spot.caveId)?.name || 'Gua tidak ditemukan'}</span>
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
         {filteredSpots.length === 0 && <p className="text-center text-muted-foreground pt-8">Belum ada spot untuk gua ini.</p>}
      </div>
    </div>
  );
}
