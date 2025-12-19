
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
import { Trash2, Plus, GripVertical, Loader2, Download, WifiOff, ArrowRight, Monitor, MessageSquare, Power, PowerOff, Send, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveKioskSettings, setKioskControl } from '@/lib/firestore';
import Link from 'next/link';
import { isCaveAvailableOffline, saveCaveForOffline } from '@/lib/offline';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Label } from '@/components/ui/label';

const globalSettingsSchema = z.object({
  logoUrl: z.string().url({ message: "URL tidak valid." }).optional().or(z.literal('')),
  mode: z.enum(['loop', 'shuffle']),
  exitPin: z.string().length(4, 'PIN harus terdiri dari 4 digit.').regex(/^\d{4}$/, 'PIN harus berupa 4 angka.'),
});

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

const remoteControlSchema = z.object({
  message: z.string().optional(),
});

type GlobalSettingsFormValues = z.infer<typeof globalSettingsSchema>;
type PlaylistSettingsFormValues = z.infer<typeof playlistSettingsSchema>;
type RemoteControlFormValues = z.infer<typeof remoteControlSchema>;
type KioskDevice = { id: string, status: string, currentSpotId?: string, updatedAt: Timestamp };

interface KioskClientProps {
  initialCaves: Cave[];
}


function KioskRemoteControl({ allSpots }: { allSpots: Spot[] }) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const devicesQuery = useMemoFirebase(() => collection(firestore, 'kioskDevices'), [firestore]);
  const { data: devices, isLoading: devicesLoading } = useCollection<KioskDevice>(devicesQuery);
  const controlRef = useMemoFirebase(() => doc(firestore, 'kioskControl', 'global'), [firestore]);
  const { data: controlState, isLoading: controlLoading } = useDoc<{enabled: boolean, message?: string, forceReload?: boolean}>(controlRef);

  const controlForm = useForm<RemoteControlFormValues>({
    resolver: zodResolver(remoteControlSchema),
    defaultValues: { message: '' },
  });

  const isKioskEnabled = controlState?.enabled ?? true;

  const handleToggleKiosk = (enabled: boolean) => {
    setKioskControl({ enabled });
    toast({ title: enabled ? "Kios Diaktifkan" : "Kios Dinonaktifkan", description: 'Perubahan akan diterapkan dalam beberapa detik.' });
  };
  
  const handleReloadKiosk = () => {
    if (confirm('Anda yakin ingin memuat ulang semua kios? Ini akan memulai ulang tayangan di semua perangkat.')) {
      setKioskControl({ forceReload: true, ts: Date.now() });
      toast({ title: "Memuat Ulang Kios", description: 'Perintah telah dikirim.' });
    }
  };

  const onSendMessage = (values: RemoteControlFormValues) => {
    setKioskControl({ message: values.message, ts: Date.now() });
    toast({ title: "Pesan Terkirim", description: 'Pesan akan ditampilkan di semua kios.' });
  };
  
  const getSpotTitle = (spotId: string) => allSpots.find(s => s.id === spotId)?.title || 'Unknown Spot';

  return (
      <Card>
          <CardHeader>
              <CardTitle>Kendali Jarak Jauh Kios</CardTitle>
              <CardDescription>Pantau dan kelola semua perangkat kios yang sedang aktif.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Perangkat Aktif</h4>
                  {devicesLoading ? <Skeleton className="h-16 w-full" /> : (
                      devices && devices.length > 0 ? (
                          <div className="border rounded-md divide-y">
                              {devices.map(device => (
                                  <div key={device.id} className="p-3 flex justify-between items-center">
                                      <div className='flex items-center gap-3'>
                                          <Monitor className="h-5 w-5"/>
                                          <div>
                                              <p className="font-semibold">{device.id}</p>
                                              <p className="text-xs text-muted-foreground">
                                                  Spot: {device.currentSpotId ? getSpotTitle(device.currentSpotId) : 'N/A'}
                                              </p>
                                          </div>
                                      </div>
                                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                                         <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                         {device.updatedAt ? formatDistanceToNow(device.updatedAt.toDate(), { addSuffix: true, locale: id }) : 'Baru saja'}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : <p className="text-xs text-muted-foreground text-center py-4">Tidak ada kios yang aktif saat ini.</p>
                  )}
              </div>
              <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Perintah Global</h4>
                  <div className='flex flex-wrap gap-2'>
                       <Form {...controlForm}>
                          <form onSubmit={controlForm.handleSubmit(onSendMessage)} className="flex gap-2 flex-grow">
                             <FormField
                                control={controlForm.control}
                                name="message"
                                render={({ field }) => (
                                <FormItem className="flex-grow">
                                    <FormControl>
                                      <div className="relative">
                                          <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                          <Input placeholder="Ketik pesan singkat di sini..." className="pl-9" {...field} />
                                      </div>
                                    </FormControl>
                                </FormItem>
                                )}
                              />
                              <Button type="submit" variant="secondary"><Send className="h-4 w-4"/></Button>
                          </form>
                      </Form>
                      <div className="flex items-center space-x-2">
                          <Switch
                              id="kiosk-enabled"
                              checked={isKioskEnabled}
                              onCheckedChange={handleToggleKiosk}
                              disabled={controlLoading}
                          />
                          <Label htmlFor="kiosk-enabled">{isKioskEnabled ? 'Aktif' : 'Nonaktif'}</Label>
                      </div>
                      <Button onClick={handleReloadKiosk} variant="outline" size="icon">
                        <Radio className="h-4 w-4" />
                        <span className="sr-only">Muat Ulang Kios</span>
                      </Button>
                  </div>
              </div>
          </CardContent>
      </Card>
  );
}


export default function KioskClient({ initialCaves }: KioskClientProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isOffline, setIsOffline] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const spotsQuery = useMemoFirebase(() => collection(firestore, 'spots'), [firestore]);
  const { data: spots, isLoading: spotsLoading } = useCollection<Spot>(spotsQuery);
  const settingsRef = useMemoFirebase(() => doc(firestore, 'kioskSettings', 'main'), [firestore]);
  const { data: kioskSettings, isLoading: settingsLoading } = useDoc<KioskSettings>(settingsRef);
  
  const globalForm = useForm<GlobalSettingsFormValues>({
    resolver: zodResolver(globalSettingsSchema),
    defaultValues: { logoUrl: '', mode: 'loop', exitPin: '1234' },
  });

  const playlistForm = useForm<PlaylistSettingsFormValues>({
    resolver: zodResolver(playlistSettingsSchema),
    defaultValues: { caveId: '', playlist: [] },
  });
  
  useEffect(() => {
    if (kioskSettings) {
        globalForm.reset({
            logoUrl: kioskSettings.logoUrl || '',
            mode: kioskSettings.mode || 'loop',
            exitPin: kioskSettings.exitPin || '1234',
        });
        playlistForm.reset({
            caveId: kioskSettings.caveId || '',
            playlist: kioskSettings.playlist || [],
        });
    }
  }, [kioskSettings, globalForm, playlistForm]);

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

  const onGlobalSubmit = (values: GlobalSettingsFormValues) => {
    saveKioskSettings(values);
    toast({ title: 'Berhasil', description: 'Pengaturan global telah disimpan.' });
  };
  
  const onPlaylistSubmit = (values: PlaylistSettingsFormValues) => {
    saveKioskSettings(values);
    toast({ title: 'Berhasil', description: 'Pengaturan daftar putar kios telah disimpan.' });
  };

  if (settingsLoading || spotsLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <>
      <KioskRemoteControl allSpots={spots || []} />

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
                              value={field.value}
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
                  <Button type="submit" disabled={globalForm.formState.isSubmitting} className="ml-auto">
                      {globalForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
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
                    <div className='flex items-center gap-2 flex-wrap justify-end'>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div>
                                        <Button onClick={handleDownload} disabled={isDownloading || isOffline || !selectedCave} variant="secondary" type="button">
                                            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : isOffline ? <WifiOff className="h-4 w-4"/> : <Download className="h-4 w-4" />}
                                            <span className='hidden sm:inline ml-2'>{isOffline ? 'Tersimpan Offline' : 'Simpan Offline'}</span>
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
                                <span className='hidden sm:inline mr-2'>Buka Mode Kios</span>
                                <ArrowRight className="h-4 w-4" />
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
                        value={field.value}
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
                <FormLabel>Urutan Spot di Playlist</FormLabel>
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
                            <div className="relative w-32 md:w-48">
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
                <Button type="submit" disabled={playlistForm.formState.isSubmitting} className="ml-auto">
                    {playlistForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Simpan Daftar Putar
                </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </>
  );
}
