
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mountain, MapPin, Users, Gem, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMemo, useState, useEffect } from 'react';
import { useFirestore } from '@/app/layout';
import { collection, onSnapshot } from 'firebase/firestore';
import { Location, Spot, UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface Stat {
  title: string;
  value: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

export default function AdminDashboard() {
  const firestore = useFirestore();

  const [locations, setLocations] = useState<Location[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const locationsRef = collection(firestore, 'locations');
    const spotsRef = collection(firestore, 'spots');
    const usersRef = collection(firestore, 'users');

    const unsubLocations = onSnapshot(locationsRef, (snapshot) => {
      setLocations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location)));
    });

    const unsubSpots = onSnapshot(spotsRef, (snapshot) => {
      setSpots(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Spot)));
    });

    const unsubUsers = onSnapshot(usersRef, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile)));
    });

    // Determine loading state
    const timer = setTimeout(() => setIsLoading(false), 1000); // Give a bit of time for initial fetch

    return () => {
      unsubLocations();
      unsubSpots();
      unsubUsers();
      clearTimeout(timer);
    };
  }, [firestore]);


  const stats: Stat[] = useMemo(() => [
    { title: 'Total Lokasi', value: (locations?.length ?? 0).toString(), icon: <Mountain className="h-6 w-6" />, href: '/admin/locations', color: 'bg-blue-900/50 text-blue-100' },
    { title: 'Total Spot', value: (spots?.length ?? 0).toString(), icon: <MapPin className="h-6 w-6" />, href: '/admin/spots', color: 'bg-green-900/50 text-green-100' },
    { title: 'Total Pengguna', value: (users?.length ?? 0).toString(), icon: <Users className="h-6 w-6" />, href: '/admin/users', color: 'bg-yellow-900/50 text-yellow-100' },
  ], [locations, spots, users]);

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang di Panel Admin.</p>
      </header>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} className={cn('border-none hover:scale-105 transition-transform', stat.color)}>
             <Link href={stat.href}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-bold">{stat.value}</div>
                )}
              </CardContent>
             </Link>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-4">
         <Card>
           <CardHeader>
             <CardTitle>Pintasan Cepat</CardTitle>
             <p className="text-muted-foreground pt-2">Akses cepat ke bagian-bagian penting di panel admin.</p>
           </CardHeader>
           <CardContent className="flex flex-wrap gap-4">
             <Button asChild><Link href="/admin/locations">Kelola Lokasi</Link></Button>
             <Button asChild><Link href="/admin/spots">Kelola Spot</Link></Button>
             <Button asChild><Link href="/admin/users">Kelola Pengguna</Link></Button>
             <Button asChild><Link href="/admin/pricing">Kelola Paket</Link></Button>
             <Button asChild><Link href="/admin/kiosk">Pengaturan Aplikasi</Link></Button>
           </CardContent>
         </Card>
      </div>
      
    </div>
  );
}
