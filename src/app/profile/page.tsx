
'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { UserProfile, Artifact, UserArtifact } from '@/lib/types';
import { doc, collection, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Loader2, User as UserIcon, Gem, Award, ShieldCheck, Mail, ArrowLeft, BookUser, Edit } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getAllArtifacts, updateUserProfile } from '@/lib/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';


function ArtifactCard({ artifact, isFound }: { artifact: Artifact; isFound: boolean }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className={`overflow-hidden transition-all duration-300 ${!isFound && 'bg-muted/40'}`}>
            <CardContent className="p-0">
              <div className="relative aspect-square">
                <Image
                  src={artifact.imageUrl}
                  alt={artifact.name}
                  fill
                  className={`object-cover ${!isFound && 'opacity-30 grayscale'}`}
                  data-ai-hint="ancient artifact"
                />
                 {!isFound && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <p className="font-bold text-5xl text-white/50">?</p>
                    </div>
                 )}
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom">
            <p className="font-bold text-md">{artifact.name}</p>
            <p className="text-sm text-muted-foreground">{isFound ? artifact.description : 'Artefak ini belum ditemukan.'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}


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
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isEditProfileOpen, setEditProfileOpen] = useState(false);

  const allArtifacts = getAllArtifacts();

  // Get user profile
  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  // Get user's found artifacts
  const userArtifactsRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'users', user.uid, 'artifacts');
  }, [user, firestore]);
  const { data: foundArtifacts, isLoading: isArtifactsLoading } = useCollection<UserArtifact>(userArtifactsRef);


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  const loading = isUserLoading || isProfileLoading || isArtifactsLoading;

  if (loading || !userProfile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const getRoleIcon = (role: string) => {
    switch(role) {
        case 'pro': return <Gem className="h-4 w-4 text-amber-400" />;
        case 'admin': return <ShieldCheck className="h-4 w-4 text-red-500" />;
        default: return <UserIcon className="h-4 w-4 text-gray-400" />;
    }
  }

  const foundArtifactIds = new Set(foundArtifacts?.map(a => a.id) || []);

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
                           <Badge variant={userProfile.role === 'pro' || userProfile.role === 'admin' ? 'default' : 'secondary'} className="gap-2">
                                {getRoleIcon(userProfile.role)}
                                <span className="uppercase">{userProfile.role}</span>
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
           <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <BookUser className="h-6 w-6 text-primary" />
                        Buku Catatan Penjelajah
                    </CardTitle>
                    <CardDescription>
                        Daftar artefak yang telah Anda temukan dalam petualangan Anda.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isArtifactsLoading ? (
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="aspect-square w-full" />
                            ))}
                         </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                           {allArtifacts.map((artifact) => (
                               <ArtifactCard key={artifact.id} artifact={artifact} isFound={foundArtifactIds.has(artifact.id)} />
                           ))}
                           {allArtifacts.length === 0 && <p className="col-span-full text-center text-muted-foreground">Belum ada artefak yang bisa ditemukan.</p>}
                        </div>
                    )}
                </CardContent>
           </Card>
        </main>
    </div>
    {userProfile && <EditProfileDialog userProfile={userProfile} open={isEditProfileOpen} onOpenChange={setEditProfileOpen} />}
    </>
  );
}
