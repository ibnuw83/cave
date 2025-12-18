
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Cave, Spot, KioskSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Trash2, Plus, GripVertical, Loader2, Download, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveKioskSettings } from '@/lib/firestore';
import Link from 'next/link';
import { isCaveAvailableOffline, saveCaveForOffline } from '@/lib/offline';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCollection } from '@/firebase';
import { collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Schema untuk pengaturan global
const globalSettingsSchema = z.object({
  logoUrl: z.string().url({ message: "URL tidak valid." }).optional().or(z.literal('')),
  mode: z.enum(['loop', 'shuffle']),
  exitPin: z.string().length(4, 'PIN harus terdiri dari 4 digit.').regex(/^\d{4}$/, 'PIN harus berupa 4 angka.'),
});

// Schema untuk pengaturan playlist
const playlistSettingsSchema = z.object({
  caveId: z.string().min(1, 'Gua harus dipilih.'),
  playlist: z.array(z.object({
    spotId: z.string().min(1, 'Spot harus dipilih.'),
    duration: z.coerce.number().min(5, 'Durasi minimal 5 detik.').max(300, 'Durasi maksimal 300 detik.'),
  })).min(1, 'Minimal harus ada 1 spot di playlist.').refine(
    (items) => new Set(items.map(i => i.spotId)).size === items.length,
    { message: 'Spot tidak boleh duplikat dalam playlist.' }
  ),
});

type GlobalSettingsFormValues = z.infer<typeof globalSettingsSchema>;
type PlaylistSettingsFormValues = z.infer<typeof playlistSettingsSchema>;

interface KioskClientProps {
  initialCaves: Cave[];
  initialSettings: KioskSettings | null;
}

export default function KioskClient({ initialCaves, initialSettings }: KioskClientProps) {
  const { toast } = useToast();
  const [isOffline, setIsOffline] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const spotsQuery = useMemo(() => collection(db, 'spots'), []);
  const { data: spots, loading: spotsLoading } = useCollection<Spot>(spotsQuery);
  
  const globalForm = useForm<GlobalSettingsFormValues>({
    resolver: zodResolver(globalSettingsSchema),
    defaultValues: {
      logoUrl: initialSettings?.logoUrl || '',
      mode: initialSettings?.mode || 'loop',
      exitPin: initialSettings?.exitPin || '1234',
    },
  });

  const playlistForm = useForm<PlaylistSettingsFormValues>({
    resolver: zodResolver(playlistSettingsSchema),
    defaultValues: {
      caveId: initialSettings?.caveId || '',
      playlist: initialSettings?.playlist || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: playlistForm.control,
    name: 'playlist',
  });

  const watchCaveId = playlistForm.watch('caveId');

  const availableSpots = useMemo(() => {
    if (!watchCaveId || !spots) return [];
    return spots.filter(spot => spot.caveId === watchCaveId);
  }, [watchCaveId, spots]);

  const selectedCave = useMemo(() => {
    return initialCaves.find(c => c.id === watchCaveId) || null;
  }, [watchCaveId, initialCaves]);
  
  useEffect(() => {
    async function checkOfflineStatus() {
      if (watchCaveId) {
        const offline = await isCaveAvailableOffline(watchCaveId);
        setIsOffline(offline);
      } else {
        setIsOffline(false);
      }
    }
    checkOfflineStatus();
  }, [watchCaveId]);

  const handleDownload = async () => {
    if (!selectedCave || availableSpots.length === 0) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Pilih gua dan pastikan ada spot tersedia untuk diunduh.' });
      return;
    }

    setIsDownloading(true);
    toast({ title: 'Mengunduh...', description: `Konten untuk ${selectedCave.name} sedang disimpan untuk mode offline.` });
    try {
      await saveCaveForOffline(selectedCave, availableSpots);
      setIsOffline(true);
      toast({ title: 'Berhasil!', description: `${selectedCave.name} telah tersedia untuk mode offline.` });
    } catch (error) {
      console.error('Failed to save for offline:', error);
      toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menyimpan konten untuk mode offline.' });
    } finally {
      setIsDownloading(false);
    }
  };

  const onGlobalSubmit = async (values: GlobalSettingsFormValues) => {
    try {
        await saveKioskSettings(values);
        toast({ title: 'Berhasil', description: 'Pengaturan global telah disimpan.' });
    } catch (error: any) {
        if (error.code !== 'permission-denied') {
           toast({
            variant: 'destructive',
            title: 'Gagal',
            description: 'Terjadi kesalahan saat menyimpan pengaturan global.',
          });
        }
    }
  };
  
  const onPlaylistSubmit = async (values: PlaylistSettingsFormValues) => {
    try {
        await saveKioskSettings(values);
        toast({ title: 'Berhasil', description: 'Pengaturan daftar putar kios telah disimpan.' });
    } catch (error: any) {
        if (error.code !== 'permission-denied') {
           toast({
            variant: 'destructive',
            title: 'Gagal',
            description: 'Terjadi kesalahan saat menyimpan daftar putar kios.',
          });
        }
    }
  };

  const isGlobalSubmitting = globalForm.formState.isSubmitting;
  const isPlaylistSubmitting = playlistForm.formState.isSubmitting;

  return (
    <>
      <Form {...globalForm}>
        <form onSubmit={globalForm.handleSubmit(onGlobalSubmit)}>
          <Card>
              <CardHeader>
                  <CardTitle>Pengaturan Global</CardTitle>
                  <CardDescription>Pengaturan umum untuk seluruh aplikasi.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <FormField
                      control={globalForm.control}
                      name="logoUrl"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>URL Logo Aplikasi</FormLabel>
                          <FormControl>
                              <Input placeholder="https://example.com/logo.png" {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                      control={globalForm.control}
                      name="mode"
                      render={({ field }) => (
                          <FormItem className="space-y-3">
                          <FormLabel>Mode Pemutaran Kios</FormLabel>
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
                      <FormField
                          control={globalForm.control}
                          name="exitPin"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>PIN Keluar Kios</FormLabel>
                              <FormControl>
                              <Input type="password" placeholder="cth: 1234" maxLength={4} {...field} />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                  </div>
              </CardContent>
               <CardFooter>
                  <Button type="submit" disabled={isGlobalSubmitting} className="ml-auto">
                      {isGlobalSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                      Simpan Pengaturan Global
                  </Button>
              </CardFooter>
          </Card>
        </form>
      </Form>

      <Form {...playlistForm}>
        <form onSubmit={playlistForm.handleSubmit(onPlaylistSubmit)}>
          <Card>
            <CardHeader>
                <div className='flex justify-between items-start gap-4'>
                    <div>
                        <CardTitle>Daftar Putar Kios</CardTitle>
                        <CardDescription>Pilih gua dan atur spot yang akan diputar otomatis.</CardDescription>
                    </div>
                    <div className='flex gap-2'>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div>
                                        <Button onClick={handleDownload} disabled={isDownloading || isOffline || !selectedCave} variant="secondary" type="button">
                                            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isOffline ? <WifiOff className="mr-2 h-4 w-4"/> : <Download className="mr-2 h-4 w-4" />}
                                            {isOffline ? 'Tersimpan Offline' : 'Simpan Offline'}
                                        </Button>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>{isOffline ? 'Konten gua ini sudah bisa diakses offline.' : 'Unduh semua spot di gua ini untuk akses offline.'}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <Button asChild variant="outline">
                            <Link href="/kios" target="_blank">
                                Buka Mode Kios
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={playlistForm.control}
                name="caveId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Pilih Gua untuk Kios</FormLabel>
                    <Select 
                        onValueChange={(value) => {
                        field.onChange(value);
                        playlistForm.setValue('playlist', []); 
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

              <div className="space-y-4">
                <FormLabel>Playlist Spot</FormLabel>
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <FormField
                        control={playlistForm.control}
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
                        control={playlistForm.control}
                        name={`playlist.${index}.duration`}
                        render={({ field }) => (
                        <FormItem>
                            <div className="relative w-48">
                            <FormControl>
                                <Input type="number" placeholder="Detik" {...field} className="pr-12"/>
                            </FormControl>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">detik</span>
                            </div>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    </div>
                ))}
                {playlistForm.formState.errors.playlist?.root && <FormMessage>{playlistForm.formState.errors.playlist.root.message}</FormMessage>}
                {Array.isArray(playlistForm.formState.errors.playlist) && playlistForm.formState.errors.playlist.map((error, index) => (
                    error && <FormMessage key={index}>Baris {index + 1}: {error.spotId?.message || error.duration?.message}</FormMessage>
                ))}
                </div>

                <Button
                type="button"
                variant="outline"
                onClick={() => append({ spotId: '', duration: 30 })}
                disabled={!watchCaveId || spotsLoading}
                >
                <Plus className="mr-2 h-4 w-4" /> Tambah Spot ke Playlist
                </Button>
            </CardContent>
            <CardFooter>
                <Button type="submit" disabled={isPlaylistSubmitting} className="ml-auto">
                    {isPlaylistSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Simpan Daftar Putar
                </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </>
  );
}
