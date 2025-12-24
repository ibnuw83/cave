
'use client';

import { useState, useMemo } from "react";
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
import { useUser, useAuth } from "@/firebase";

export default function LocationsClient({ 
    initialLocations, 
    onDataChange,
    onEdit,
    onAdd,
}: { 
    initialLocations: Location[], 
    onDataChange: () => void,
    onEdit: (location: Location) => void,
    onAdd: () => void,
 }) {
  const { userProfile } = useUser();
  const auth = useAuth();
  const { toast } = useToast();

  const sortedLocations = useMemo(() => {
    return [...initialLocations].sort((a,b) => a.name.localeCompare(b.name));
  }, [initialLocations]);

  const handleDelete = async (id: string) => {
    if (!auth.currentUser) {
        toast({ variant: 'destructive', title: 'Gagal', description: 'Anda harus login untuk menghapus lokasi.' });
        return;
    }
    try {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`/api/admin/locations/${id}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Gagal menghapus lokasi.');
        }
        toast({ title: "Berhasil", description: "Lokasi dan semua spot di dalamnya berhasil dihapus." });
        onDataChange();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Gagal', description: error.message });
    }
  };

  if (userProfile?.role !== 'admin') {
    return (
      <p className="text-center text-muted-foreground py-12">
        Anda tidak memiliki akses ke halaman ini.
      </p>
    );
  }
  
  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Lokasi
        </Button>
      </div>

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
                  <Button variant="outline" size="icon" onClick={() => onEdit(location)}>
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
          {sortedLocations.length === 0 && <p className="text-center text-muted-foreground py-8">Belum ada lokasi.</p>}
      </div>
    </div>
  );
}
