
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Artifact, Cave, Spot } from '@/lib/types';
import { addArtifact, updateArtifact } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMemo } from 'react';

const artifactSchema = z.object({
  name: z.string().min(1, { message: 'Nama artefak tidak boleh kosong.' }),
  description: z.string().min(1, { message: 'Deskripsi tidak boleh kosong.' }),
  imageUrl: z.string().url({ message: 'URL gambar tidak valid.' }),
  caveId: z.string().min(1, 'Gua harus dipilih.'),
  spotId: z.string().min(1, 'Spot harus dipilih.'),
});

type ArtifactFormValues = z.infer<typeof artifactSchema>;

interface ArtifactFormProps {
  artifact: Artifact | null;
  caves: Cave[];
  spots: Spot[];
  onSave: () => void;
  onCancel: () => void;
}

export function ArtifactForm({ artifact, caves, spots, onSave, onCancel }: ArtifactFormProps) {
  const { toast } = useToast();

  const form = useForm<ArtifactFormValues>({
    resolver: zodResolver(artifactSchema),
    defaultValues: {
      name: artifact?.name || '',
      description: artifact?.description || '',
      imageUrl: artifact?.imageUrl || '',
      caveId: artifact?.caveId || '',
      spotId: artifact?.spotId || '',
    },
  });
  
  const isSubmitting = form.formState.isSubmitting;
  const watchCaveId = form.watch('caveId');

  const availableSpots = useMemo(() => {
    return spots.filter(spot => spot.caveId === watchCaveId);
  }, [watchCaveId, spots]);


  const onSubmit = async (values: ArtifactFormValues) => {
    try {
      if (artifact) {
        await updateArtifact(artifact.id, values);
      } else {
        await addArtifact(values);
      }
      onSave();
    } catch (error) {
        // Error is now handled by the permission-error emitter in firestore.ts
    }
  };

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">{artifact ? 'Edit Artefak' : 'Tambah Artefak Baru'}</h1>
        <p className="text-muted-foreground">Isi detail artefak di bawah ini.</p>
      </header>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Artefak</FormLabel>
                <FormControl>
                  <Input placeholder="cth: Kristal Cahaya" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deskripsi</FormLabel>
                <FormControl>
                  <Textarea placeholder="Deskripsi singkat tentang artefak..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL Gambar Artefak</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                 <FormDescription>Gunakan URL gambar yang representatif untuk artefak ini.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="caveId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gua</FormLabel>
                <Select onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue('spotId', ''); // Reset spot selection
                }} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih gua..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {caves.map((cave) => (
                      <SelectItem key={cave.id} value={cave.id}>
                        {cave.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 <FormDescription>Pilih gua tempat artefak ini disembunyikan.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="spotId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Spot</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!watchCaveId || availableSpots.length === 0}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={!watchCaveId ? "Pilih gua dulu" : "Pilih spot..."} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableSpots.map((spot) => (
                      <SelectItem key={spot.id} value={spot.id}>
                        {spot.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 <FormDescription>Pilih spot spesifik di mana artefak ini berada.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {artifact ? 'Simpan Perubahan' : 'Simpan Artefak'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

    