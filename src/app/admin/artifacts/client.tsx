
'use client';

import { useState, useMemo } from "react";
import { Artifact, Cave, Spot } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";
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
import { deleteArtifact } from "@/lib/firestore";
import { ArtifactForm } from "./artifact-form";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

export default function ArtifactsClient({ initialCaves, initialSpots }: { initialCaves: Cave[], initialSpots: Spot[] }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  const artifactsQuery = useMemoFirebase(() => collection(firestore, 'artifacts'), [firestore]);
  const { data: artifacts, isLoading: artifactsLoading } = useCollection<Artifact>(artifactsQuery);

  const handleFormSuccess = () => {
    if (selectedArtifact) {
      toast({ title: "Berhasil", description: "Artefak berhasil diperbarui." });
    } else {
      toast({ title: "Berhasil", description: "Artefak baru berhasil ditambahkan." });
    }
    setIsFormOpen(false);
    setSelectedArtifact(null);
  };

  const openForm = (artifact: Artifact | null) => {
    setSelectedArtifact(artifact);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
        await deleteArtifact(id);
        toast({ title: "Berhasil", description: "Artefak berhasil dihapus." });
    } catch (error) {
        // The error is handled by the permission-error emitter in firestore.ts
    }
  };

  const getSpotInfo = (spotId: string) => {
      const spot = initialSpots.find(s => s.id === spotId);
      if (!spot) return { spotName: 'Spot tidak ada', caveName: '' };
      const cave = initialCaves.find(c => c.id === spot.caveId);
      return { spotName: spot.title, caveName: cave?.name || 'Gua tidak ada' };
  }

  if (isFormOpen) {
    return <ArtifactForm 
        artifact={selectedArtifact} 
        onSave={handleFormSuccess} 
        onCancel={() => { setIsFormOpen(false); setSelectedArtifact(null); }}
        caves={initialCaves}
        spots={initialSpots} 
    />;
  }
  
  const sortedArtifacts = useMemo(() => {
    if (!artifacts) return [];
    return [...artifacts].sort((a, b) => a.name.localeCompare(b.name));
  }, [artifacts]);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => openForm(null)}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Artefak
        </Button>
      </div>

      {artifactsLoading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedArtifacts.map((artifact) => {
            const { spotName, caveName } = getSpotInfo(artifact.spotId);
            return (
                <Card key={artifact.id} className="flex flex-col">
                    <CardHeader className="flex-row items-start justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg">{artifact.name}</CardTitle>
                            <CardDescription>
                                di: {spotName} ({caveName})
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={() => openForm(artifact)}>
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
                                    <AlertDialogTitle>Anda yakin ingin menghapus artefak ini?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    Aksi ini akan menghapus artefak "{artifact.name}". Aksi ini tidak dapat diurungkan.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(artifact.id)}>Hapus</AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow flex items-center justify-center">
                        <div className="relative w-32 h-32">
                           <Image src={artifact.imageUrl} alt={artifact.name} fill className="object-contain" />
                        </div>
                    </CardContent>
                </Card>
            )
        })}
         {sortedArtifacts.length === 0 && <p className="col-span-full text-center text-muted-foreground py-8">Belum ada artefak.</p>}
      </div>
      )}
    </div>
  );
}

    