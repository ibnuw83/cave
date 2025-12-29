
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Location } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/firebase';
import { AdminMiniMapEditor } from './admin-mini-map-editor';
import { doc, setDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';

const locationSchema = z.object({
  name: z.string().min(1, { message: 'Nama lokasi tidak boleh kosong.' }),
  category: z.string().min(1, { message: 'Kategori harus diisi.' }),
  description: z.string().min(1, { message: 'Deskripsi tidak boleh kosong.' }),
  coverImage: z.string().url({ message: 'URL gambar tidak valid.' }),
  isActive: z.boolean(),
});

type LocationFormValues = z.infer<typeof locationSchema>;

interface LocationFormProps {
  location: Location | null;
  onSave: (location: Location) => void;
  onCancel: () => void;
}

export function LocationForm({ location, onSave, onCancel }: LocationFormProps) {
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: location?.name || '',
      category: location?.category || '',
      description: location?.description || '',
      coverImage: location?.coverImage || '',
      isActive: location?.isActive ?? true,
    },
  });
  
  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: LocationFormValues) => {
    if (!auth.currentUser) {
      toast({
        variant: 'destructive',
        title: 'Belum login',
        description: 'Silakan login sebagai admin.',
      });
      return;
    }
  
    try {
      let savedLocation;
      if (location) {
        // Update existing location
        const docRef = doc(firestore, 'locations', location.id);
        const dataToUpdate = {
          ...values,
          updatedAt: serverTimestamp(),
        };
        await setDoc(docRef, dataToUpdate, { merge: true });
        savedLocation = { ...location, ...dataToUpdate };
      } else {
        // Create new location
        const dataToSave = {
          ...values,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          miniMap: { nodes: [], edges: [] },
        };
        const docRef = await addDoc(collection(firestore, 'locations'), dataToSave);
        savedLocation = { id: docRef.id, ...dataToSave } as Location;
      }
      onSave(savedLocation);

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Gagal', description: error.message || 'Gagal menyimpan lokasi.' });
    }
  };

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">{location ? 'Edit Lokasi' : 'Tambah Lokasi Baru'}</h1>
        <p className="text-muted-foreground">Isi detail lokasi di bawah ini.</p>
      </header>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Lokasi</FormLabel>
                <FormControl>
                  <Input placeholder="cth: Gua Jomblang" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori</FormLabel>
                  <FormControl>
                    <Input placeholder="cth: Gua, Situs Sejarah, Pantai, dll." {...field} />
                  </FormControl>
                  <FormDescription>
                    Masukkan jenis lokasi wisata (contoh: Gua, Situs Sejarah, Geopark).
                  </FormDescription>
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
                  <Textarea placeholder="Deskripsi singkat tentang lokasi..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="coverImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL Gambar Cover</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <FormLabel>Aktif</FormLabel>
                    <FormDescription>
                        Jika aktif, lokasi akan muncul di halaman utama.
                    </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {location ? 'Simpan Perubahan' : 'Simpan Lokasi'}
            </Button>
          </div>
        </form>
      </Form>

       {location?.id && (
        <AdminMiniMapEditor
          locationId={location.id}
          initialMap={location.miniMap ?? { nodes: [], edges: [] }}
        />
      )}
    </div>
  );
}
