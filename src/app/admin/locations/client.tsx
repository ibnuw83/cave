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
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

export default function LocationsClient() {
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const locationsRef = collection(firestore, 'locations');
    const unsubscribe = onSnapshot(locationsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
      setLocations(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);

  const sortedLocations = useMemo(() => {
    if (!locations) return [];
    return [...locations].sort((a,b) => a.name.localeCompare(b.name));
  }, [locations]);

  const handleDelete = async (id: string) => {
    try {
        await deleteDoc(doc(firestore, 'locations', id));
        toast({ title: "Berhasil", description: "Lokasi berhasil dihapus." });
        // The onSnapshot hook will automatically update the UI
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Gagal', description: error.message });
    }
  };

  const handleEdit = (location: Location) => {
    router.push(`/admin/locations/${location.id}`);
  };

  const handleAdd = () => {
    router.push('/admin/locations/new');
  }

  if (isLoading) {
    return (
       <div className="space-y-4">
          <div className="flex justify-end mb-4">
              <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Lokasi
        </Button>
      </div>

      <div className="space-y-4">
          {(sortedLocations || []).map((location) => (
          <Card key={location.id}>
              <CardHeader>
              <div className="flex justify-between items-start">
                  <div>
                  <CardTitle className="text-lg">{location.name}</CardTitle>
                  <CardDescription className="flex items-center flex-wrap gap-2 mt-1">
                      <Badge variant={location.isActive ? "default" : "secondary"}>
                          {location.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                       <Badge variant="outline" className="ml-2">{location.category}</Badge>
                  </CardDescription>
                  </div>
                  <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(location)}>
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
