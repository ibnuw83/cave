
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mountain, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { getLocations, getAllSpotsForAdmin } from '@/lib/firestore-client';
import { Location, Spot, UserProfile } from '@/lib/types';

interface Stat {
  title: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  color: string;
}

export default function AdminDashboard() {
  const { userProfile, isProfileLoading } = useUser();
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      if (userProfile?.role !== 'admin') return;

      setLoading(true);
      try {
        // Fetch data that doesn't require a separate API call first
        const locationsPromise = getLocations(true);
        const spotsPromise = getAllSpotsForAdmin();
        const usersPromise = fetch('/api/admin/users').then(res => {
            if (!res.ok) throw new Error('Gagal mengambil data pengguna');
            return res.json();
        });

        const [locationsRes, spotsRes, usersRes] = await Promise.all([locationsPromise, spotsPromise, usersPromise]);

        setStats([
          { title: 'Total Lokasi', value: locationsRes.length, icon: <Mountain className="h-6 w-6" />, href: '/admin/locations', color: 'bg-blue-900/50 text-blue-100' },
          { title: 'Total Spot', value: spotsRes.length, icon: <MapPin className="h-6 w-6" />, href: '/admin/spots', color: 'bg-green-900/50 text-green-100' },
          { title: 'Total Pengguna', value: usersRes.length, icon: <Users className="h-6 w-6" />, href: '/admin/users', color: 'bg-yellow-900/50 text-yellow-100' },
        ]);

      } catch (error: any) {
        console.error("Failed to fetch admin dashboard data:", error);
        toast({
          variant: 'destructive',
          title: 'Gagal Memuat Dashboard',
          description: error.message || 'Tidak dapat mengambil data statistik.',
        });
      } finally {
        setLoading(false);
      }
    }
    
    if (!isProfileLoading && userProfile) {
        fetchData();
    }
  }, [userProfile, isProfileLoading, toast]);
  
  if (isProfileLoading) {
      return (
        <div className="p-4 md:p-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        </div>
      );
  }

  if (userProfile?.role !== 'admin') {
    return (
      <div className="p-4 md:p-8">
        <p className="text-center text-muted-foreground py-12">
          Anda tidak memiliki akses ke halaman ini.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang di Admin Panel, {userProfile.displayName}.</p>
      </header>
      
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.title} className={cn('border-none hover:scale-105 transition-transform', stat.color)}>
              <Link href={stat.href}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  {stat.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-1">
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
             <Button asChild><Link href="/admin/kiosk">Pengaturan Kios</Link></Button>
           </CardContent>
         </Card>
      </div>
      
    </div>
  );
}
