
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Cave } from '@/lib/types';
import { addCave, updateCave } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase';

const caveSchema = z.object({
  name: z.string().min(1, { message: 'Nama gua tidak boleh kosong.' }),
  description: z.string().min(1, { message: 'Deskripsi tidak boleh kosong.' }),
  coverImage: z.string().url({ message: 'URL gambar tidak valid.' }),
  isActive: z.boolean(),
});

type CaveFormValues = z.infer<typeof caveSchema>;

interface CaveFormProps {
  cave: Cave | null;
  onSave: (cave: Cave) => void;
  onCancel: () => void;
}

export function CaveForm({ cave, onSave, onCancel }: CaveFormProps) {
  const { toast } = useToast();

  const form = useForm<CaveFormValues>({
    resolver: zodResolver(caveSchema),
    defaultValues: {
      name: cave?.name || '',
      description: cave?.description || '',
      coverImage: cave?.coverImage || '',
      isActive: cave?.isActive ?? true,
    },
  });
  
  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: CaveFormValues) => {
    if (!auth.currentUser) {
        toast({
            variant: 'destructive',
            title: 'Belum login',
            description: 'Silakan login sebagai admin.',
        });
        return;
    }
    try {
      if (cave) {
        const updatedCaveData = { ...cave, ...values };
        await updateCave(cave.id, values);
        onSave(updatedCaveData);
      } else {
        const newCaveData: Omit<Cave, 'id'> = values;
        const newCaveId = await addCave(newCaveData);
        onSave({ id: newCaveId, ...newCaveData });
      }
    } catch (error: any) {
        // The error is handled by the permission-error emitter in firestore.ts
        // No need to show a toast here, it will be handled globally.
    }
  };

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">{cave ? 'Edit Gua' : 'Tambah Gua Baru'}</h1>
        <p className="text-muted-foreground">Isi detail gua di bawah ini.</p>
      </header>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Gua</FormLabel>
                <FormControl>
                  <Input placeholder="cth: Gua Jomblang" {...field} />
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
                  <Textarea placeholder="Deskripsi singkat tentang gua..." {...field} />
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
                        Jika aktif, gua akan muncul di halaman utama.
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
              {cave ? 'Simpan Perubahan' : 'Simpan Gua'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
