
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PricingTier } from '@/lib/types';
import { setPricingTier } from '@/lib/firestore-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore } from '@/app/layout';

const tierSchema = z.object({
  id: z.string().min(1, 'ID Paket (role) harus dipilih.'),
  order: z.coerce.number().min(0, 'Urutan harus angka positif.'),
  name: z.string().min(1, 'Nama paket tidak boleh kosong.'),
  price: z.string().min(1, 'Harga tidak boleh kosong.'),
  priceDescription: z.string().min(1, 'Deskripsi harga tidak boleh kosong.'),
  cta: z.string().min(1, 'Teks tombol (CTA) tidak boleh kosong.'),
  isPopular: z.boolean(),
  features: z.array(z.string().min(1, 'Fitur tidak boleh kosong.')).min(1, 'Minimal harus ada satu fitur.'),
});

type TierFormValues = z.infer<typeof tierSchema>;

interface PricingTierFormProps {
  tier: PricingTier | null;
  allRoles: string[];
  onSave: (tier: PricingTier) => void;
  onCancel: () => void;
}

export function PricingTierForm({ tier, allRoles, onSave, onCancel }: PricingTierFormProps) {
  const { toast } = useToast();
  const db = useFirestore();

  const form = useForm<TierFormValues>({
    resolver: zodResolver(tierSchema),
    defaultValues: {
      id: tier?.id || '',
      order: tier?.order ?? 0,
      name: tier?.name || '',
      price: tier?.price || '',
      priceDescription: tier?.priceDescription || '',
      cta: tier?.cta || 'Pilih Paket',
      isPopular: tier?.isPopular ?? false,
      features: tier?.features || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'features',
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: TierFormValues) => {
    try {
      const newTierData: PricingTier = {
        ...values,
      };
      await setPricingTier(db, newTierData);
      onSave(newTierData);
    } catch (error) {
      // Error is handled by the global error handler
    }
  };

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">{tier ? 'Edit Paket Harga' : 'Tambah Paket Baru'}</h1>
        <p className="text-muted-foreground">Isi detail paket di bawah ini.</p>
      </header>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Paket (Sesuai Role)</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!tier}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih role..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allRoles.map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Urutan Tampil</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Paket</FormLabel>
                <FormControl>
                  <Input placeholder="cth: PRO 1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga</FormLabel>
                  <FormControl>
                    <Input placeholder="cth: Rp 15k" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priceDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi Harga</FormLabel>
                  <FormControl>
                    <Input placeholder="cth: per bulan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
           <FormField
            control={form.control}
            name="cta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teks Tombol (CTA)</FormLabel>
                <FormControl>
                  <Input placeholder="cth: Pilih PRO 1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isPopular"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Tandai sebagai Populer</FormLabel>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <div>
            <FormLabel>Fitur Paket</FormLabel>
            <div className="space-y-2 mt-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name={`features.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormControl>
                          <Input placeholder={`Fitur ${index + 1}`} {...field} />
                        </FormControl>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append('')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Fitur
            </Button>
             {form.formState.errors.features?.root && (
                <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.features.root.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Paket
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
