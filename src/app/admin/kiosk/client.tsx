

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Location, Spot, KioskSettings, PaymentGatewaySettings, AdSenseSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Trash2, Plus, GripVertical, Loader2, Download, WifiOff, ArrowRight, Monitor, MessageSquare, Power, PowerOff, Send, Radio, Facebook, Instagram, Twitter, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveKioskSettings, setKioskControl } from '@/lib/firestore-client';
import Link from 'next/link';
import { isLocationAvailableOffline, saveLocationForOffline } from '@/lib/offline';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase/provider';
import { collection, doc, Timestamp, onSnapshot } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const globalSettingsSchema = z.object({
  logoUrl: z.string().url({ message: "URL tidak valid." }).optional().or(z.literal('')),
  mode: z.enum(['loop', 'shuffle']),
  exitPin: z.string().length(4, 'PIN harus terdiri dari 4 digit.').regex(/^\d{4}$/, 'PIN harus berupa 4 angka.'),
});

const heroSettingsSchema = z.object({
  mainTitle: z.string().optional(),
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional(),
});

const footerSettingsSchema = z.object({
  footerText: z.string().optional(),
  facebookUrl: z.string().url({ message: "URL tidak valid." }).optional().or(z.literal('')),
  instagramUrl: z.string().url({ message: "URL tidak valid." }).optional().or(z.literal('')),
  twitterUrl: z.string().url({ message: "URL tidak valid." }).optional().or(z.literal('')),
});

const playlistSettingsSchema = z.object({
  locationId: z.string().min(1, 'Lokasi harus dipilih.'),
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

const paymentGatewaySchema = z.object({
    paymentGateway: z.object({
        provider: z.enum(['midtrans', 'xendit', 'none']),
        mode: z.enum(['sandbox', 'production']),
        clientKey: z.string().optional(),
        serverKey: z.string().optional(),
    })
});

const adsenseSchema = z.object({
    adsense: z.object({
        clientId: z.string().optional(),
        adSlotId: z.string().optional(),
    })
});

type GlobalSettingsFormValues = z.infer<typeof globalSettingsSchema>;
type HeroSettingsFormValues = z.infer<typeof heroSettingsSchema>;
type FooterSettingsFormValues = z.infer<typeof footerSettingsSchema>;
type PlaylistSettingsFormValues = z.infer<typeof playlistSettingsSchema>;
type RemoteControlFormValues = z.infer<typeof remoteControlSchema>;
type PaymentGatewayFormValues = z.infer<typeof paymentGatewaySchema>;
type AdSenseFormValues = z.infer<typeof adsenseSchema>;


type KioskDevice = { id: string, status: string, currentSpotId?: string, updatedAt: Timestamp };

interface KioskClientProps {
  initialLocations: Location[];
}


function KioskRemoteControl({ allSpots }: { allSpots: Spot[] }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { userProfile } = useUser();
  const [devices, setDevices] = useState<KioskDevice[]>([]);
  const [controlState, setControlState] = useState<{enabled: boolean, message?: string, forceReload?: boolean} | null>(null);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [controlLoading, setControlLoading] = useState(true);


  useEffect(() => {
    if (userProfile?.role !== 'admin') return;

    const devicesRef = collection(firestore, 'kioskDevices');
    const devicesUnsub = onSnapshot(devicesRef, (snapshot) => {
      setDevices(snapshot.docs.map(d => ({id: d.id, ...d.data()} as KioskDevice)));
      setDevicesLoading(false);
    });

    const controlRef = doc(firestore, 'kioskControl', 'global');
    const controlUnsub = onSnapshot(controlRef, (snapshot) => {
        if (snapshot.exists()) {
            setControlState(snapshot.data() as any);
        }
        setControlLoading(false);
    });

    return () => {
        devicesUnsub();
        controlUnsub();
    }
  }, [userProfile, firestore]);

  const controlForm = useForm<RemoteControlFormValues>({
    resolver: zodResolver(remoteControlSchema),
    defaultValues: { message: '' },
  });

  const isKioskEnabled = controlState?.enabled ?? true;

  const handleToggleKiosk = (enabled: boolean) => {
    setKioskControl(firestore, { enabled });
    toast({ title: enabled ? "Kios Diaktifkan" : "Kios Dinonaktifkan", description: 'Perubahan akan diterapkan dalam beberapa detik.' });
  };
  
  const handleReloadKiosk = () => {
    if (confirm('Anda yakin ingin memuat ulang semua kios? Ini akan memulai ulang tayangan di semua perangkat.')) {
      setKioskControl(firestore, { forceReload: true, ts: Date.now() });
      toast({ title: "Memuat Ulang Kios", description: 'Perintah telah dikirim.' });
    }
  };

  const onSendMessage = (values: RemoteControlFormValues) => {
    setKioskControl(firestore, { message: values.message, ts: Date.now() });
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


export default function KioskClient({ initialLocations }: KioskClientProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { userProfile } = useUser();
  const [isOffline, setIsOffline] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const spotsRef = useMemo(() => userProfile?.role === 'admin' ? collection(firestore, 'spots') : null, [userProfile, firestore]);
  const settingsRef = useMemo(() => userProfile?.role === 'admin' ? doc(firestore, 'kioskSettings', 'main') : null, [userProfile, firestore]);

  const { data: spots, isLoading: spotsLoading } = useCollection<Spot>(spotsRef);
  const { data: kioskSettings, isLoading: settingsLoading } = useDoc<KioskSettings>(settingsRef);
  
  const globalForm = useForm<GlobalSettingsFormValues>({
    resolver: zodResolver(globalSettingsSchema),
    defaultValues: { logoUrl: '', mode: 'loop', exitPin: '1234' },
  });

  const heroForm = useForm<HeroSettingsFormValues>({
    resolver: zodResolver(heroSettingsSchema),
    defaultValues: { mainTitle: '', heroTitle: '', heroSubtitle: '' },
  });

  const footerForm = useForm<FooterSettingsFormValues>({
    resolver: zodResolver(footerSettingsSchema),
    defaultValues: { footerText: '', facebookUrl: '', instagramUrl: '', twitterUrl: '' },
  });

  const playlistForm = useForm<PlaylistSettingsFormValues>({
    resolver: zodResolver(playlistSettingsSchema),
    defaultValues: { locationId: '', playlist: [] },
  });

  const paymentForm = useForm<PaymentGatewayFormValues>({
      resolver: zodResolver(paymentGatewaySchema),
      defaultValues: {
          paymentGateway: {
              provider: 'none',
              mode: 'sandbox',
              clientKey: '',
              serverKey: '',
          }
      },
  });

  const adsenseForm = useForm<AdSenseFormValues>({
    resolver: zodResolver(adsenseSchema),
    defaultValues: {
      adsense: {
        clientId: '',
        adSlotId: '',
      },
    },
  });
  
  useEffect(() => {
    if (kioskSettings) {
        globalForm.reset({
            logoUrl: kioskSettings.logoUrl || '',
            mode: kioskSettings.mode || 'loop',
            exitPin: kioskSettings.exitPin || '1234',
        });
        heroForm.reset({
            mainTitle: kioskSettings.mainTitle || '',
            heroTitle: kioskSettings.heroTitle || '',
            heroSubtitle: kioskSettings.heroSubtitle || '',
        });
        footerForm.reset({
            footerText: kioskSettings.footerText || '',
            facebookUrl: kioskSettings.facebookUrl || '',
            instagramUrl: kioskSettings.instagramUrl || '',
            twitterUrl: kioskSettings.twitterUrl || '',
        });
        playlistForm.reset({
            locationId: kioskSettings.locationId || '',
            playlist: kioskSettings.playlist || [],
        });
        paymentForm.reset({
            paymentGateway: kioskSettings.paymentGateway || { provider: 'none', mode: 'sandbox', clientKey: '', serverKey: '' },
        });
        adsenseForm.reset({
            adsense: kioskSettings.adsense || { clientId: '', adSlotId: '' },
        });
    }
  }, [kioskSettings, globalForm, heroForm, footerForm, playlistForm, paymentForm, adsenseForm]);

  const { fields, append, remove } = useFieldArray({
    control: playlistForm.control,
    name: 'playlist',
  });

  const watchLocationId = playlistForm.watch('locationId');

  const availableSpots = useMemo(() => {
    if (!watchLocationId || !spots) return [];
    return spots.filter(spot => spot.locationId === watchLocationId);
  }, [watchLocationId, spots]);

  const selectedLocation = useMemo(() => {
    return initialLocations.find(l => l.id === watchLocationId) || null;
  }, [watchLocationId, initialLocations]);
  
  useEffect(() => {
    async function checkOfflineStatus() {
      if (watchLocationId) {
        const offline = await isLocationAvailableOffline(watchLocationId);
        setIsOffline(offline);
      } else {
        setIsOffline(false);
      }
    }
    checkOfflineStatus();
  }, [watchLocationId]);

  const handleDownload = async () => {
    if (!selectedLocation || availableSpots.length === 0) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Pilih lokasi dan pastikan ada spot tersedia untuk diunduh.' });
      return;
    }

    setIsDownloading(true);
    toast({ title: 'Mengunduh...', description: `Konten untuk ${selectedLocation.name} sedang disimpan untuk mode offline.` });
    try {
      await saveLocationForOffline(selectedLocation, availableSpots);
      setIsOffline(true);
      toast({ title: 'Berhasil!', description: `${selectedLocation.name} telah tersedia untuk mode offline.` });
    } catch (error) {
      console.error('Failed to save for offline:', error);
      toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menyimpan konten untuk mode offline.' });
    } finally {
      setIsDownloading(false);
    }
  };

  const onGlobalSubmit = async (values: GlobalSettingsFormValues) => {
    await saveKioskSettings(firestore, values);
    toast({ title: 'Berhasil', description: 'Pengaturan global telah disimpan.' });
  };
  
  const onHeroSubmit = async (values: HeroSettingsFormValues) => {
    await saveKioskSettings(firestore, values);
    toast({ title: 'Berhasil', description: 'Pengaturan halaman utama telah disimpan.' });
  };

  const onFooterSubmit = async (values: FooterSettingsFormValues) => {
    await saveKioskSettings(firestore, values);
    toast({ title: 'Berhasil', description: 'Pengaturan footer & media sosial telah disimpan.' });
  };

  const onPlaylistSubmit = async (values: PlaylistSettingsFormValues) => {
    await saveKioskSettings(firestore, values);
    toast({ title: 'Berhasil', description: 'Pengaturan daftar putar kios telah disimpan.' });
  };

  const onPaymentSubmit = async (values: PaymentGatewayFormValues) => {
      await saveKioskSettings(firestore, values);
      toast({ title: 'Berhasil', description: 'Pengaturan pembayaran telah disimpan.'});
  }

  const onAdSenseSubmit = async (values: AdSenseFormValues) => {
      await saveKioskSettings(firestore, values);
      toast({ title: 'Berhasil', description: 'Pengaturan AdSense telah disimpan.' });
  }

  if (userProfile?.role !== 'admin') {
    return (
      <p className="text-center text-muted-foreground py-12">
        Anda tidak memiliki akses ke halaman ini.
      </p>
    );
  }

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
        <form onSubmit={globalForm.handleSubmit(onGlobalSubmit)} className="space-y-8 mt-8">
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
      
      <Form {...heroForm}>
        <form onSubmit={heroForm.handleSubmit(onHeroSubmit)} className="space-y-8 mt-8">
           <Card>
              <CardHeader>
                  <CardTitle>Pengaturan Halaman Utama</CardTitle>
                  <CardDescription>Kelola judul dan subjudul yang tampil di halaman depan.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <FormField
                      control={heroForm.control}
                      name="mainTitle"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Judul Utama</FormLabel>
                          <FormControl>
                              <Input placeholder="Penjelajah Gua" {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                  <FormField
                      control={heroForm.control}
                      name="heroTitle"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Judul Hero</FormLabel>
                          <FormControl>
                              <Input placeholder="Masuki Dunia Bawah Tanah" {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                  <FormField
                      control={heroForm.control}
                      name="heroSubtitle"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Subjudul Hero</FormLabel>
                          <FormControl>
                              <Textarea placeholder="Rasakan pengalaman 4D..." {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
              </CardContent>
               <CardFooter>
                  <Button type="submit" disabled={heroForm.formState.isSubmitting} className="ml-auto">
                      {heroForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                      Simpan Pengaturan Halaman Utama
                  </Button>
              </CardFooter>
          </Card>
        </form>
      </Form>

      <Form {...footerForm}>
        <form onSubmit={footerForm.handleSubmit(onFooterSubmit)} className="space-y-8 mt-8">
           <Card>
              <CardHeader>
                  <CardTitle>Footer &amp; Media Sosial</CardTitle>
                  <CardDescription>Kelola teks di footer dan tautan media sosial.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <FormField
                      control={footerForm.control}
                      name="footerText"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Teks Footer</FormLabel>
                          <FormControl>
                              <Input placeholder="© {tahun} Nama Aplikasi. Hak cipta dilindungi." {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                          control={footerForm.control}
                          name="twitterUrl"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>URL Twitter</FormLabel>
                              <FormControl>
                                <div className="relative">
                                    <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="https://twitter.com/..." className="pl-9" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                      <FormField
                          control={footerForm.control}
                          name="instagramUrl"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>URL Instagram</FormLabel>
                              <FormControl>
                               <div className="relative">
                                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="https://instagram.com/..." className="pl-9" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                       <FormField
                          control={footerForm.control}
                          name="facebookUrl"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>URL Facebook</FormLabel>
                              <FormControl>
                                <div className="relative">
                                    <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="https://facebook.com/..." className="pl-9" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                  </div>
              </CardContent>
               <CardFooter>
                  <Button type="submit" disabled={footerForm.formState.isSubmitting} className="ml-auto">
                      {footerForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                      Simpan Pengaturan Footer
                  </Button>
              </CardFooter>
          </Card>
        </form>
      </Form>


      <Form {...playlistForm}>
        <form onSubmit={playlistForm.handleSubmit(onPlaylistSubmit)} className="space-y-8 mt-8">
          <Card>
            <CardHeader>
                <div className='flex justify-between items-start gap-4'>
                    <div>
                        <CardTitle>Daftar Putar Kios</CardTitle>
                        <CardDescription>Pilih lokasi dan atur spot yang akan diputar otomatis.</CardDescription>
                    </div>
                    <div className='flex items-center gap-2 flex-wrap justify-end'>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div>
                                        <Button onClick={handleDownload} disabled={isDownloading || isOffline || !selectedLocation} variant="secondary" type="button">
                                            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : isOffline ? <WifiOff className="h-4 w-4"/> : <Download className="h-4 w-4" />}
                                            <span className='hidden sm:inline ml-2'>{isOffline ? 'Tersimpan Offline' : 'Simpan Offline'}</span>
                                        </Button>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>{isOffline ? 'Konten lokasi ini sudah bisa diakses offline.' : 'Unduh semua spot di lokasi ini untuk akses offline.'}</p>
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
                name="locationId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Pilih Lokasi untuk Kios</FormLabel>
                    <Select 
                        onValueChange={(value) => {
                        field.onChange(value);
                        playlistForm.setValue('playlist', []); 
                        }} 
                        value={field.value}
                    >
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih lokasi untuk ditampilkan di kios..." />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {initialLocations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                            {location.name}
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
                disabled={!watchLocationId || spotsLoading}
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

       <Form {...paymentForm}>
        <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-8 mt-8">
           <Card>
              <CardHeader>
                  <CardTitle>Pengaturan Pembayaran</CardTitle>
                  <CardDescription>Konfigurasi kunci API dari penyedia gerbang pembayaran Anda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField
                        control={paymentForm.control}
                        name="paymentGateway.provider"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Penyedia Pembayaran</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih penyedia..." />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="none">Tidak Aktif</SelectItem>
                                    <SelectItem value="midtrans">Midtrans</SelectItem>
                                    <SelectItem value="xendit">Xendit</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                      />
                     <FormField
                        control={paymentForm.control}
                        name="paymentGateway.mode"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Mode</FormLabel>
                             <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih mode..." />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="sandbox">Sandbox (Pengujian)</SelectItem>
                                    <SelectItem value="production">Produksi (Live)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                      />
                </div>
                 <FormField
                      control={paymentForm.control}
                      name="paymentGateway.clientKey"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Client Key</FormLabel>
                          <FormControl>
                              <Input placeholder="Midtrans Client Key / Xendit Public Key" {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                  <FormField
                      control={paymentForm.control}
                      name="paymentGateway.serverKey"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Server Key (Secret)</FormLabel>
                          <FormControl>
                              <Input type="password" placeholder="••••••••••••••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
              </CardContent>
               <CardFooter>
                  <Button type="submit" disabled={paymentForm.formState.isSubmitting} className="ml-auto">
                      {paymentForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                      Simpan Pengaturan Pembayaran
                  </Button>
              </CardFooter>
          </Card>
        </form>
      </Form>

       <Form {...adsenseForm}>
        <form onSubmit={adsenseForm.handleSubmit(onAdSenseSubmit)} className="space-y-8 mt-8">
           <Card>
              <CardHeader>
                  <CardTitle>Pengaturan Monetisasi</CardTitle>
                  <CardDescription>Konfigurasi Google AdSense untuk menampilkan iklan.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <FormField
                      control={adsenseForm.control}
                      name="adsense.clientId"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>ID Klien AdSense</FormLabel>
                          <FormControl>
                              <Input placeholder="ca-pub-XXXXXXXXXXXXXXXX" {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                  <FormField
                      control={adsenseForm.control}
                      name="adsense.adSlotId"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>ID Slot Iklan</FormLabel>
                          <FormControl>
                              <Input placeholder="XXXXXXXXXX" {...field} />
                          </FormControl>
                           <FormDescription>ID untuk unit iklan responsif utama Anda.</FormDescription>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
              </CardContent>
               <CardFooter>
                  <Button type="submit" disabled={adsenseForm.formState.isSubmitting} className="ml-auto">
                      {adsenseForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                      Simpan Pengaturan AdSense
                  </Button>
              </CardFooter>
          </Card>
        </form>
      </Form>
    </>
  );
}

