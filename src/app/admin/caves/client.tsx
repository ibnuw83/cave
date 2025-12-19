'use client';

import { useState, useMemo } from "react";
import { Cave } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
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
import { deleteCave, getCaves } from "@/lib/firestore";
import { CaveForm } from "./cave-form";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CavesClient() {
  const [caves, setCaves] = useState<Cave[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCave, setSelectedCave] = useState<Cave | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCaves = () => {
        setLoading(true);
        getCaves(true).then(c => {
            setCaves(c);
            setLoading(false);
        }).catch(() => setLoading(false));
    }
    // Fetch caves when the component mounts or when returning from the form
    if (!isFormOpen) {
        fetchCaves();
    }
  }, [isFormOpen]);


  const handleFormSuccess = () => {
    if (selectedCave) {
      toast({ title: "Berhasil", description: "Gua berhasil diperbarui." });
    } else {
      toast({ title: "Berhasil", description: "Gua baru berhasil ditambahkan." });
    }
    setIsFormOpen(false);
    setSelectedCave(null);
    // Data will be re-fetched by the useEffect
  };

  const openForm = (cave: Cave | null) => {
    setSelectedCave(cave);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
        await deleteCave(id);
        setCaves(caves.filter((c) => c.id !== id));
        toast({ title: "Berhasil", description: "Gua dan semua spot di dalamnya berhasil dihapus." });
    } catch (error) {
        // The error is handled by the permission-error emitter in firestore.ts
    }
  };

  if (isFormOpen) {
    return <CaveForm cave={selectedCave} onSave={handleFormSuccess} onCancel={() => { setIsFormOpen(false); setSelectedCave(null); }} />;
  }
  
  const sortedCaves = useMemo(() => {
    return [...caves].sort((a,b) => a.name.localeCompare(b.name));
  }, [caves]);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => openForm(null)}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Gua
        </Button>
      </div>

       {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
            {sortedCaves.map((cave) => (
            <Card key={cave.id}>
                <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                    <CardTitle className="text-lg">{cave.name}</CardTitle>
                    <CardDescription>
                        <Badge variant={cave.isActive ? "default" : "secondary"}>
                            {cave.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                    </CardDescription>
                    </div>
                    <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => openForm(cave)}>
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
                            Aksi ini akan menghapus gua "{cave.name}" dan semua spot di dalamnya. Aksi ini tidak dapat diurungkan.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(cave.id)}>Hapus</AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    </div>
                </div>
                </CardHeader>
            </Card>
            ))}
            {sortedCaves.length === 0 && !loading && <p className="text-center text-muted-foreground py-8">Belum ada gua.</p>}
        </div>
      )}
    </div>
  );
}
