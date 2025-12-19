
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Cave, Spot } from '@/lib/types';
import { addSpot, updateSpot } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const spotSchema = z.object({
  caveId: z.string().min(1, 'Gua harus dipilih.'),
  order: z.coerce.number().min(0, 'Urutan tidak boleh negatif.'),
  title: z.string().min(1, 'Judul tidak boleh kosong.'),
  description: z.string().min(1, 'Deskripsi tidak boleh kosong.'),
  imageUrl: z.string().url('URL gambar tidak valid.'),
  audioUrl: z.string().url('URL audio tidak valid.').optional().or(z.literal('')),
  isPro: z.boolean(),
  viewType: z.enum(['auto', 'flat', 'panorama']),
  vibrationPattern: z.string().optional().refine(
    (val) => {
      if (!val) return true;
      return /^(\d+)(,\s*\d+)*$/.test(val);
    },
    { message: 'Pola getaran harus berupa angka dipisahkan koma, cth: 60,40,60' }
  ),
});

type SpotFormValues = Omit<z.infer<typeof spotSchema>, 'vibrationPattern'> & {vibrationPattern?: string};

interface SpotFormProps {
  spot: Spot | null;
  caves: Cave[];
  onSave: (spot: Spot) => void;
  onCancel: () => void;
}

export function SpotForm({ spot, caves, onSave, onCancel }: SpotFormProps) {
  const { toast } = useToast();

  const form = useForm<SpotFormValues>({
    resolver: zodResolver(spotSchema),
    defaultValues: {
      caveId: spot?.caveId || '',
      order: spot?.order ?? 0,
      title: spot?.title || '',
      description: spot?.description || '',
      imageUrl: spot?.imageUrl || '',
      audioUrl: spot?.audioUrl || '',
      isPro: spot?.isPro ?? false,
      viewType: spot?.viewType || 'auto',
      vibrationPattern: spot?.effects?.vibrationPattern?.join(',') || '',
    },
  });
  
  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: SpotFormValues) => {
    const spotData: Omit<Spot, 'id'> = {
      ...values,
      effects: {
        vibrationPattern: values.vibrationPattern ? values.vibrationPattern.split(',').map(Number) : [],
      },
    };
    // remove vibrationPattern from top level
    delete (spotData as any).vibrationPattern;

    try {
      if (spot) {
        await updateSpot(spot.id, spotData);
        onSave({ id: spot.id, ...spotData });
      } else {
        const newSpotId = await addSpot(spotData);
        onSave({ id: newSpotId, ...spotData });
      }
    } catch (error) {
        // Error is now handled by the permission-error emitter in firestore.ts
        // The toast will be shown by the global listener.
    }
  };

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">{spot ? 'Edit Spot' : 'Tambah Spot Baru'}</h1>
        <p className="text-muted-foreground">Isi detail spot penjelajahan di bawah ini.</p>
      </header>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="caveId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gua</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Judul Spot</FormLabel>
                <FormControl>
                  <Input placeholder="cth: Cahaya dari Surga" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Urutan</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormDescription>Urutan spot akan ditampilkan di aplikasi.</FormDescription>
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
                  <Textarea placeholder="Deskripsi singkat tentang spot ini..." {...field} />
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
                <FormLabel>URL Gambar Spot</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

           <FormField
            control={form.control}
            name="audioUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL Audio Suara Alam (Opsional)</FormLabel>
                <FormControl>
                  <Input placeholder="https://.../suara-tetesan.mp3" {...field} />
                </FormControl>
                <FormDescription>URL ke file audio (mp3, wav) untuk suara latar.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

            <FormField
                control={form.control}
                name="viewType"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Tipe Tampilan</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || 'auto'}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe tampilan..." />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="auto">Deteksi Otomatis</SelectItem>
                        <SelectItem value="flat">Gambar Datar</SelectItem>
                        <SelectItem value="panorama">Panorama / 360</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormDescription>Pilih bagaimana gambar akan ditampilkan di halaman detail.</FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />
          
          <FormField
            control={form.control}
            name="vibrationPattern"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pola Getaran (Opsional)</FormLabel>
                <FormControl>
                  <Input placeholder="cth: 60,40,60" {...field} />
                </FormControl>
                <FormDescription>Angka dalam milidetik, dipisahkan koma.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isPro"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Spot PRO</FormLabel>
                  <FormDescription>
                    Jika aktif, hanya user PRO yang bisa mengakses.
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
              {spot ? 'Simpan Perubahan' : 'Simpan Spot'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
