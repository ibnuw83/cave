'use client';

import Link from 'next/link';
import { Cave, UserProfile } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Mountain, LogIn, LogOut } from 'lucide-react';

const AuthSection = () => {
  const { user, userProfile, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) {
    return <div className="h-10 w-48 animate-pulse rounded-md bg-muted/50"></div>;
  }

  if (user && userProfile) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-semibold">{userProfile.displayName}</p>
          <Badge variant={userProfile.role === 'pro' ? 'default' : 'secondary'} className="uppercase">
            {userProfile.role}
          </Badge>
        </div>
        <Button variant="outline" size="icon" onClick={signOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={signInWithGoogle}>
      <LogIn className="mr-2 h-4 w-4" /> Masuk dengan Google
    </Button>
  );
};


export default function HomeClient({ caves }: { caves: Cave[] }) {
  return (
    <div className="container mx-auto min-h-screen max-w-4xl p-4 md:p-8">
      <header className="flex items-center justify-between pb-8">
        <div className="flex items-center gap-3">
          <Mountain className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl font-headline">
            Penjelajah Gua
          </h1>
        </div>
        <AuthSection />
      </header>

      <main>
        <h2 className="mb-6 text-xl font-semibold text-foreground/90 md:text-2xl">Gua yang Tersedia</h2>
        {caves.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {caves.map((cave) => (
              <Link href={`/cave/${cave.id}`} key={cave.id} className="group">
                <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:scale-105">
                  <CardHeader className="p-0">
                    <div className="relative h-48 w-full">
                      <Image
                        src={cave.coverImage}
                        alt={`Gambar ${cave.name}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        data-ai-hint="cave entrance"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-lg font-bold font-headline">{cave.name}</CardTitle>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Tidak ada gua yang tersedia saat ini.</p>
        )}
      </main>
    </div>
  );
}
