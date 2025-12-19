
'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { UserProfile, Artifact } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Loader2, User as UserIcon, Gem, Award, ShieldCheck, Mail, ArrowLeft, BookUser } from 'lucide-react';
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

// Placeholder data until we create the artifacts in the database
const placeholderArtifacts: Artifact[] = [
    {
        id: 'crystal-of-light',
        caveId: 'jomblang',
        spotId: 'light-from-heaven',
        name: 'Kristal Cahaya',
        description: 'Sebuah kristal yang memancarkan cahaya surgawi, ditemukan di jantung Gua Jomblang.',
        imageUrl: 'https://picsum.photos/seed/crystal/400/400'
    },
    {
        id: 'echo-stone',
        caveId: 'gong',
        spotId: 'great-stalactite',
        name: 'Batu Gema',
        description: 'Batu yang beresonansi dengan suara tetesan air di Gua Gong.',
        imageUrl: 'https://picsum.photos/seed/stone/400/400'
    }
];

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


export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  const loading = isUserLoading || isProfileLoading;

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

  return (
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
                        <h1 className="text-3xl font-bold font-headline">{userProfile.displayName}</h1>
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                       {placeholderArtifacts.map((artifact) => (
                           // For now, we'll pretend the user found the first one.
                           <ArtifactCard key={artifact.id} artifact={artifact} isFound={artifact.id === 'crystal-of-light'} />
                       ))}
                    </div>
                </CardContent>
           </Card>
        </main>
    </div>
  );
}
