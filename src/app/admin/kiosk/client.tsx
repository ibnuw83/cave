
'use client';

import { useState, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Cave, Spot, KioskSettings, KioskPlaylistItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Trash2, Plus, GripVertical, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveKioskSettings } from '@/lib/firestore';
import Link from 'next/link';

const kioskSettingsSchema = z.object({
  caveId: z.string().min(1, 'Gua harus dipilih.'),
  playlist: z.array(z.object({
    spotId: z.string().min(1, 'Spot harus dipilih.'),
    duration: z.coerce.number().min(5, 'Durasi minimal 5 detik.'),
  })).min(1, 'Minimal harus ada 1 spot di playlist.'),
});

type KioskSettingsFormValues = z.infer<typeof kioskSettingsSchema>;

interface KioskClientProps {
  initialCaves: Cave[];
  initialSpots: Spot[];
  initialSettings: KioskSettings | null;
}

export default function KioskClient({ initialCaves, initialSpots, initialSettings }: KioskClientProps) {
  const { toast } = useToast();
  
  const form = useForm<KioskSettingsFormValues>({
    resolver: zodResolver(kioskSettingsSchema),
    defaultValues: {
      caveId: initialSettings?.caveId || '',
      playlist: initialSettings?.playlist || [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'playlist',
  });

  const watchCaveId = form.watch('caveId');

  const availableSpots = useMemo(() => {
    return initialSpots.filter(spot => spot.caveId === watchCaveId);
  }, [watchCaveId, initialSpots]);

  const onSubmit = async (values: KioskSettingsFormValues) => {
    try {
        await saveKioskSettings(values);
        toast({ title: 'Berhasil', description: 'Pengaturan kios telah disimpan.' });
    } catch (error: any) {
        if (error.code !== 'permission-denied') {
           toast({
            variant: 'destructive',
            title: 'Gagal',
            description: 'Terjadi kesalahan saat menyimpan pengaturan kios.',
          });
        }
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Card>
      <CardHeader>
        <div className='flex justify-between items-center'>
            <div>
                <CardTitle>Daftar Putar Kios</CardTitle>
                <CardDescription>Pilih gua dan atur spot yang akan diputar otomatis.</CardDescription>
            </div>
            <Button asChild variant="outline">
                <Link href="/kios" target="_blank">
                    Buka Mode Kios
                </Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="caveId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pilih Gua</FormLabel>
                  <Select onValueChange={(value) => {
                      field.onChange(value);
                      // Clear playlist when cave changes
                      form.setValue('playlist', []);
                  }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih gua untuk ditampilkan di kios..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {initialCaves.filter(c => c.isActive).map((cave) => (
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

            <div className="space-y-4">
              <FormLabel>Playlist Spot</FormLabel>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                   <Controller
                      control={form.control}
                      name={`playlist.${index}.spotId`}
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih spot..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableSpots.map(spot => (
                                <SelectItem key={spot.id} value={spot.id}>
                                  {spot.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  <Controller
                    control={form.control}
                    name={`playlist.${index}.duration`}
                    render={({ field: inputField }) => (
                       <div className="relative w-48">
                         <Input type="number" placeholder="Detik" {...inputField} className="pr-12"/>
                         <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">detik</span>
                       </div>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
               {form.formState.errors.playlist?.root && <FormMessage>{form.formState.errors.playlist.root.message}</FormMessage>}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ spotId: '', duration: 30 })}
              disabled={!watchCaveId}
            >
              <Plus className="mr-2 h-4 w-4" /> Tambah Spot ke Playlist
            </Button>
            
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Simpan Pengaturan Kios
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
