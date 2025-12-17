
'use client';

import { useState } from "react";
import { Cave } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { deleteCave } from "@/lib/firestore";
import { CaveForm } from "./cave-form";
import { FirestorePermissionError } from "@/lib/errors";
import { errorEmitter } from "@/lib/error-emitter";

export default function CavesClient({ initialCaves }: { initialCaves: Cave[] }) {
  const [caves, setCaves] = useState(initialCaves);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCave, setSelectedCave] = useState<Cave | null>(null);
  const { toast } = useToast();

  const handleFormSuccess = (cave: Cave) => {
    if (selectedCave) {
      setCaves(caves.map((c) => (c.id === cave.id ? cave : c)));
      toast({ title: "Berhasil", description: "Gua berhasil diperbarui." });
    } else {
      setCaves([...caves, cave]);
      toast({ title: "Berhasil", description: "Gua baru berhasil ditambahkan." });
    }
    setIsFormOpen(false);
    setSelectedCave(null);
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
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: `batch write (delete cave: ${id})`,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        } else {
            toast({ variant: 'destructive', title: 'Gagal', description: 'Terjadi kesalahan saat menghapus gua.' });
        }
    }
  };

  if (isFormOpen) {
    return <CaveForm cave={selectedCave} onSave={handleFormSuccess} onCancel={() => { setIsFormOpen(false); setSelectedCave(null); }} />;
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => openForm(null)}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Gua
        </Button>
      </div>

      <div className="space-y-4">
        {caves.map((cave) => (
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
         {caves.length === 0 && <p className="text-center text-muted-foreground">Belum ada gua.</p>}
      </div>
    </div>
  );
}
