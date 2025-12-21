'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { UserProfile } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Loader2, User as UserIcon, Gem, ShieldCheck, Mail, ArrowLeft, Edit, Crown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { updateUserProfile } from '@/lib/firestore-client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AdBanner from '@/app/components/AdBanner';


const profileSchema = z.object({
    displayName: z.string().min(1, 'Nama tidak boleh kosong'),
    photoURL: z.string().url('URL foto tidak valid').or(z.literal('')),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

function EditProfileDialog({ userProfile, onOpenChange, open }: { userProfile: UserProfile, onOpenChange: (open: boolean) => void, open: boolean }) {
    const { toast } = useToast();
    const { user } = useUser();
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            displayName: userProfile.displayName || '',
            photoURL: userProfile.photoURL || '',
        },
    });

    const onSubmit = async (data: ProfileFormValues) => {
        if (!user) return;
        try {
            await updateUserProfile(user.uid, {
                displayName: data.displayName,
                photoURL: data.photoURL,
            });
            toast({ title: 'Berhasil', description: 'Profil Anda telah diperbarui.' });
            onOpenChange(false);
            // This component does not refetch, the parent component will need to handle re-validation
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal memperbarui profil.' });
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Profil</DialogTitle>
                    <DialogDescription>
                        Perbarui informasi profil Anda di sini.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Nama Tampilan</Label>
                        <Input id="displayName" {...form.register('displayName')} />
                        {form.formState.errors.displayName && <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="photoURL">URL Foto Profil</Label>
                        <Input id="photoURL" {...form.register('photoURL')} />
                         {form.formState.errors.photoURL && <p className="text-sm text-destructive">{form.formState.errors.photoURL.message}</p>}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Batal</Button>
                        </DialogClose>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}


export default function ProfilePage() {
  const { user, userProfile, isUserLoading, isProfileLoading, refreshUserProfile } = useUser();
  const router = useRouter();
  const [isEditProfileOpen, setEditProfileOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  // When edit dialog is closed, refresh the user profile data
  useEffect(() => {
    if (!isEditProfileOpen) {
        refreshUserProfile();
    }
  }, [isEditProfileOpen, refreshUserProfile]);

  const loading = isUserLoading || isProfileLoading;

  if (loading || !userProfile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const getRoleInfo = (role: UserProfile['role']): { icon: React.ReactNode; label: string; } => {
    switch(role) {
        case 'pro1': return { icon: <Gem className="h-4 w-4 text-amber-400" />, label: 'PRO 1' };
        case 'pro2': return { icon: <Gem className="h-4 w-4 text-amber-400" />, label: 'PRO 2' };
        case 'pro3': return { icon: <Gem className="h-4 w-4 text-amber-400" />, label: 'PRO 3' };
        case 'vip': return { icon: <Crown className="h-4 w-4 text-yellow-300" />, label: 'VIP' };
        case 'admin': return { icon: <ShieldCheck className="h-4 w-4 text-red-500" />, label: 'Admin' };
        default: return { icon: <UserIcon className="h-4 w-4 text-gray-400" />, label: 'Free' };
    }
  }

  const roleInfo = getRoleInfo(userProfile.role);

  return (
    <>
    <div className="container mx-auto max-w-5xl min-h-screen p-4 md:p-8">
        <header className="mb-8">
            <Button variant="ghost" asChild className="mb-4 -ml-4">
            <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Halaman Utama
            </Link>
            </Button>
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 border-4 border-primary/50">
                        <AvatarImage src={userProfile.photoURL || undefined} alt={userProfile.displayName || 'User'} />
                        <AvatarFallback className="text-3xl">{userProfile.displayName?.charAt(0) || 'A'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                           <h1 className="text-3xl font-bold font-headline">{userProfile.displayName}</h1>
                            <Button variant="ghost" size="icon" onClick={() => setEditProfileOpen(true)}>
                                <Edit className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                           <Badge variant={userProfile.role === 'vip' || userProfile.role === 'admin' ? 'default' : 'secondary'} className="gap-2">
                                {roleInfo.icon}
                                <span className="uppercase">{roleInfo.label}</span>
                            </Badge>
                             <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Mail className="h-4 w-4" />
                                <span>{userProfile.email}</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <main>
           <AdBanner />
           <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <UserIcon className="h-6 w-6 text-primary" />
                        Detail Akun
                    </CardTitle>
                    <CardDescription>
                        Informasi mengenai akun Anda.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Di sini Anda dapat melihat ringkasan akun Anda. Untuk saat ini, belum ada detail lebih lanjut.
                    </p>
                </CardContent>
           </Card>
        </main>
    </div>
    {userProfile && <EditProfileDialog userProfile={userProfile} open={isEditProfileOpen} onOpenChange={setEditProfileOpen} />}
    </>
  );
}
