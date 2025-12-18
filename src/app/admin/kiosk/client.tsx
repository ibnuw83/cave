
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Cave, Spot, KioskSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Trash2, Plus, GripVertical, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveKioskSettings } from '@/lib/firestore';
import Link from 'next/link';

const kioskSettingsSchema = z.object({
  caveId: z.string().min(1, 'Gua harus dipilih.'),
  playlist: z.array(z.object({
    spotId: z.string().min(1, 'Spot harus dipilih.'),
    duration: z.coerce.number().min(5, 'Durasi minimal 5 detik.').max(300, 'Durasi maksimal 300 detik.'),
  })).min(1, 'Minimal harus ada 1 spot di playlist.').refine(
    (items) => new Set(items.map(i => i.spotId)).size === items.length,
    { message: 'Spot tidak boleh duplikat dalam playlist.' }
  ),
  mode: z.enum(['loop', 'shuffle']),
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
      mode: initialSettings?.mode || 'loop',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'playlist',
  });

  const watchCaveId = form.watch('caveId');

  const availableSpots = useMemo(() => {
    if (!watchCaveId) return [];
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
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('playlist', []); 
                    }} 
                    defaultValue={field.value}
                  >
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

            <FormField
              control={form.control}
              name="mode"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Mode Pemutaran</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="loop" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Loop (berurutan)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="shuffle" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Shuffle (acak)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            <div className="space-y-4">
              <FormLabel>Playlist Spot</FormLabel>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                   <FormField
                      control={form.control}
                      name={`playlist.${index}.spotId`}
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <Select onValueChange={field.onChange} value={field.value}>
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
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                  <FormField
                    control={form.control}
                    name={`playlist.${index}.duration`}
                    render={({ field }) => (
                       <FormItem>
                         <div className="relative w-48">
                           <FormControl>
                              <Input type="number" placeholder="Detik" {...field} className="pr-12"/>
                           </FormControl>
                           <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">detik</span>
                         </div>
                          <FormMessage className="pl-2"/>
                       </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
               {form.formState.errors.playlist?.root && <FormMessage>{form.formState.errors.playlist.root.message}</FormMessage>}
               {form.formState.errors.playlist && !form.formState.errors.playlist.root && (
                  <FormMessage>
                    {form.formState.errors.playlist.map((p, i) => (p?.duration?.message && <div key={i}>- {p.duration.message}</div>))}
                  </FormMessage>
               )}
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
