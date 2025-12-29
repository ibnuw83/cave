
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Location, Spot } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, PlusCircle, Sparkles, CheckCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFirestore } from '@/firebase';
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateLocationMiniMapWithSpot } from '@/lib/firestore-client';

const hotspotSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1, 'Label tidak boleh kosong.'),
  position: z.array(z.coerce.number()).length(3, 'Posisi harus 3 angka.'),
  targetSpotId: z.string().min(1, 'Spot tujuan harus dipilih.'),
});

const spotSchema = z.object({
  locationId: z.string().min(1, 'Lokasi harus dipilih.'),
  order: z.coerce.number().min(0, 'Urutan tidak boleh negatif.'),
  title: z.string().min(1, 'Judul tidak boleh kosong.'),
  description: z.string().min(1, 'Deskripsi tidak boleh kosong.'),
  imageUrl: z.string().url('URL gambar tidak valid.'),
  isPro: z.boolean(),
  viewType: z.enum(['auto', 'flat', 'panorama']),
  vibrationPattern: z.string().optional().refine(
    (val) => {
      if (!val) return true;
      return /^(\d+)(,\s*\d+)*$/.test(val);
    },
    { message: 'Pola getaran harus berupa angka dipisahkan koma, cth: 60,40,60' }
  ),
  hotspots: z.array(hotspotSchema).optional(),
});

type SpotFormValues = z.infer<typeof spotSchema>;

interface SpotFormProps {
  spot: Spot | null;
  locations: Location[];
  allSpots: Spot[];
  onSave: (spot: Spot) => void;
  onCancel: () => void;
}

export function SpotForm({ spot, locations, allSpots, onSave, onCancel }: SpotFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSuggestingImage, setIsSuggestingImage] = useState(false);
  const [uniquenessResult, setUniquenessResult] = useState<{ isUnique: boolean; feedback: string } | null>(null);
  const [isCheckingUniqueness, setIsCheckingUniqueness] = useState(false);


  const form = useForm<SpotFormValues>({
    resolver: zodResolver(spotSchema),
    defaultValues: {
      locationId: spot?.locationId || '',
      order: spot?.order ?? 0,
      title: spot?.title || '',
      description: spot?.description || '',
      imageUrl: spot?.imageUrl || '',
      isPro: spot?.isPro ?? false,
      viewType: spot?.viewType || 'auto',
      vibrationPattern: spot?.effects?.vibrationPattern?.join(',') || '',
      hotspots: spot?.hotspots || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'hotspots',
  });

  const isSubmitting = form.formState.isSubmitting;
  const watchLocationId = form.watch('locationId');
  const watchDescription = form.watch('description');

  const wordCount = useMemo(() => {
    return watchDescription?.trim().split(/\s+/).filter(Boolean).length || 0;
  }, [watchDescription]);

  const spotsInSameLocation = useMemo(() => {
    return allSpots.filter(s => s.locationId === watchLocationId && s.id !== spot?.id);
  }, [watchLocationId, allSpots, spot]);


  const onSubmit = async (values: SpotFormValues) => {
    const spotPayload: Omit<Spot, 'id'> & { createdAt?: any; updatedAt: any } = {
        locationId: values.locationId,
        order: values.order,
        title: values.title,
        description: values.description,
        imageUrl: values.imageUrl,
        isPro: values.isPro,
        viewType: values.viewType,
        effects: {
            vibrationPattern: values.vibrationPattern ? values.vibrationPattern.split(',').map(Number) : [],
        },
        hotspots: values.hotspots || [],
        updatedAt: serverTimestamp(),
    };

    try {
        let savedSpot: Spot;
        if (spot) {
            // Update existing spot
            const spotRef = doc(firestore, 'spots', spot.id);
            await setDoc(spotRef, spotPayload, { merge: true });
            savedSpot = { ...spot, ...values, effects: spotPayload.effects, hotspots: spotPayload.hotspots };
        } else {
            // Create new spot
            spotPayload.createdAt = serverTimestamp();
            const spotRef = await addDoc(collection(firestore, 'spots'), spotPayload);
            savedSpot = { id: spotRef.id, ...spotPayload } as Spot;
        }

        // After saving the spot, update the location's minimap
        await updateLocationMiniMapWithSpot(savedSpot, spotsInSameLocation);
        onSave(savedSpot);

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Gagal', description: error.message || 'Gagal menyimpan spot.' });
    }
  };

  const handleSuggestImage = async () => {
    if (!watchDescription) {
      toast({
        variant: 'destructive',
        title: 'Deskripsi Kosong',
        description: 'Tulis deskripsi spot terlebih dahulu untuk mendapatkan saran gambar.',
      });
      return;
    }
    setIsSuggestingImage(true);
    try {
      const response = await fetch('/api/suggest-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: watchDescription }),
      });
      if (!response.ok) {
        throw new Error('Gagal mendapatkan saran gambar dari AI.');
      }
      const { imageUrl } = await response.json();
      form.setValue('imageUrl', imageUrl, { shouldValidate: true });
      toast({
        title: 'Gambar Disarankan',
        description: 'URL gambar telah diperbarui. Simpan perubahan jika Anda suka.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: error.message || 'Tidak dapat menyarankan gambar saat ini.',
      });
    } finally {
      setIsSuggestingImage(false);
    }
  };

  const handleCheckUniqueness = async () => {
    if (!watchDescription) {
      toast({
        variant: 'destructive',
        title: 'Deskripsi Kosong',
        description: 'Tulis deskripsi terlebih dahulu untuk diperiksa.',
      });
      return;
    }
    setIsCheckingUniqueness(true);
    setUniquenessResult(null);
    try {
      const response = await fetch('/api/check-uniqueness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: watchDescription }),
      });
      if (!response.ok) {
        throw new Error('Gagal memeriksa keunikan teks.');
      }
      const result = await response.json();
      setUniquenessResult(result);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: error.message || 'Tidak dapat memeriksa keunikan saat ini.',
      });
    } finally {
      setIsCheckingUniqueness(false);
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
            name="locationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lokasi</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih lokasi..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {locations.map((location) => (
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
                <div className="flex justify-between items-center mb-2">
                    <FormLabel>Deskripsi</FormLabel>
                    <Button type="button" variant="outline" size="sm" onClick={handleCheckUniqueness} disabled={isCheckingUniqueness}>
                         {isCheckingUniqueness ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                        <span className="ml-2 hidden md:inline">Cek Keunikan</span>
                    </Button>
                </div>
                <FormControl>
                  <Textarea placeholder="Deskripsi singkat tentang spot ini..." {...field} rows={5} />
                </FormControl>
                 <FormDescription>
                    Jumlah Kata: {wordCount} (Disarankan 150-300 kata untuk performa SEO & AdSense yang lebih baik)
                </FormDescription>
                <FormMessage />
                {uniquenessResult && (
                    <Alert variant={uniquenessResult.isUnique ? 'default' : 'destructive'} className="mt-4 bg-card">
                        {uniquenessResult.isUnique ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                        <AlertTitle>{uniquenessResult.isUnique ? 'Deskripsi Baik!' : 'Perlu Revisi'}</AlertTitle>
                        <AlertDescription>
                            {uniquenessResult.feedback}
                        </AlertDescription>
                    </Alert>
                )}
              </FormItem>
            )}
          />

           <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL Gambar Spot</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                   <Button type="button" variant="outline" onClick={handleSuggestImage} disabled={isSuggestingImage}>
                    {isSuggestingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    <span className="ml-2 hidden md:inline">Sarankan</span>
                  </Button>
                </div>
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
          
          <Separator />

          <div>
            <h3 className="text-lg font-medium">Hotspot Navigasi</h3>
            <p className="text-sm text-muted-foreground">Hubungkan spot ini dengan spot lain dalam tampilan 3D.</p>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <FormField
                  control={form.control}
                  name={`hotspots.${index}.label`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label Hotspot</FormLabel>
                      <FormControl><Input {...field} placeholder="cth: Ke Lorong Gelap" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name={`hotspots.${index}.targetSpotId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Spot Tujuan</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih spot tujuan..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {spotsInSameLocation.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="grid grid-cols-3 gap-2">
                    <FormField
                      control={form.control}
                      name={`hotspots.${index}.position.0`}
                      render={({ field }) => (<FormItem><FormLabel>Posisi X</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}
                    />
                     <FormField
                      control={form.control}
                      name={`hotspots.${index}.position.1`}
                      render={({ field }) => (<FormItem><FormLabel>Posisi Y</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}
                    />
                     <FormField
                      control={form.control}
                      name={`hotspots.${index}.position.2`}
                      render={({ field }) => (<FormItem><FormLabel>Posisi Z</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}
                    />
                 </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ id: `hotspot-${Date.now()}`, label: '', position: [0, 0, 0], targetSpotId: '' })}
              disabled={!watchLocationId}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Hotspot
            </Button>
            {!watchLocationId && <p className="text-sm text-muted-foreground">Pilih lokasi terlebih dahulu untuk menambahkan hotspot.</p>}
          </div>


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
