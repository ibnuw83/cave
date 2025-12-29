
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth, useFirestore } from '@/firebase';
import { createUserProfile } from '@/lib/firestore-client';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';


// Schema for creating a new user. Password is required.
const createUserSchema = z.object({
  displayName: z.string().min(1, 'Nama tidak boleh kosong.'),
  email: z.string().email('Email tidak valid.'),
  password: z.string().min(6, 'Password minimal 6 karakter.'),
  role: z.enum(['free', 'pro1', 'pro2', 'pro3', 'vip', 'admin']),
});


type UserFormValues = z.infer<typeof createUserSchema>;

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function UserForm({ open, onOpenChange, onSave }: UserFormProps) {
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      role: 'free',
    },
  });
  
  useEffect(() => {
    if(open) {
        form.reset({
            displayName: '',
            email: '',
            password: '',
            role: 'free',
        });
    }
  }, [open, form]);

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: UserFormValues) => {
    try {
      // This creates the user in Firebase Auth but DOES NOT sign them in on the admin's browser.
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      
      await updateProfile(userCredential.user, {
          displayName: values.displayName
      });
      
      // Explicitly create the Firestore user profile with the selected role.
      // This is now the single source of truth for user creation logic.
      await createUserProfile(db, userCredential.user, values.role);
      
      toast({
        title: 'Berhasil!',
        description: `Pengguna baru telah dibuat.`,
      });
      onSave(); // This closes the dialog and refreshes the user list via the parent component.

    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            toast({ variant: 'destructive', title: 'Gagal', description: 'Email sudah terdaftar.' });
        } else {
            toast({ variant: 'destructive', title: 'Gagal', description: error.message || 'Gagal membuat pengguna.' });
        }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Pengguna Baru</DialogTitle>
          <DialogDescription>
            Buat akun pengguna baru. Akun akan dibuat dengan password yang Anda masukkan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Tampilan</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="user@example.com" {...field} />
                  </FormControl>
                   <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} placeholder={'Minimal 6 karakter'} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Peran</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih peran..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro1">PRO 1</SelectItem>
                        <SelectItem value="pro2">PRO 2</SelectItem>
                        <SelectItem value="pro3">PRO 3</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                    Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
