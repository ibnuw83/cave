
'use client';

import { useEffect, useState } from 'react';
import { getLocations, getAllSpotsForAdmin } from '@/lib/firestore-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mountain, MapPin, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

interface Stat {
  title: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  color: string;
}

export default function AdminDashboard() {
  const { userProfile } = useUser();
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      if (userProfile?.role === 'admin') {
        setLoading(true);
        try {
          const [locationsRes, spotsRes, usersRes] = await Promise.all([
            getLocations(true),
            getAllSpotsForAdmin(),
            fetch('/api/admin/users') // Fetch users from the secure API route
          ]);

          if (!usersRes.ok) {
            throw new Error('Gagal mengambil data pengguna.');
          }
          const users = await usersRes.json();
          
          setStats([
            { title: 'Total Lokasi', value: locationsRes.length, icon: <Mountain className="h-6 w-6" />, href: '/admin/locations', color: 'bg-blue-900/50 text-blue-100' },
            { title: 'Total Spot', value: spotsRes.length, icon: <MapPin className="h-6 w-6" />, href: '/admin/spots', color: 'bg-green-900/50 text-green-100' },
            { title: 'Total Pengguna', value: users.length, icon: <Users className="h-6 w-6" />, href: '/admin/users', color: 'bg-yellow-900/50 text-yellow-100' },
          ]);

        } catch (error: any) {
          console.error("Failed to fetch admin dashboard data:", error);
          toast({
            variant: 'destructive',
            title: 'Gagal Memuat Dashboard',
            description: error.message || 'Tidak dapat mengambil data admin.',
          });
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    fetchData();
  }, [userProfile, toast]);

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
        <p className="text-muted-foreground">Selamat datang di Admin Panel.</p>
      </header>
      
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.title} className={cn('border-none', stat.color)}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
         <Card className="flex flex-col justify-between">
           <CardHeader>
             <CardTitle>Kelola Lokasi</CardTitle>
             <p className="text-muted-foreground pt-2">Tambah, edit, atau hapus data lokasi yang tersedia di aplikasi.</p>
           </CardHeader>
           <CardContent>
             <Button asChild>
                <Link href="/admin/locations">
                  Buka Manajemen Lokasi <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
             </Button>
           </CardContent>
         </Card>
          <Card className="flex flex-col justify-between">
           <CardHeader>
             <CardTitle>Kelola Spot</CardTitle>
             <p className="text-muted-foreground pt-2">Atur spot penjelajahan di setiap lokasi, termasuk konten premium.</p>
           </CardHeader>
           <CardContent>
             <Button asChild>
                <Link href="/admin/spots">
                  Buka Manajemen Spot <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
             </Button>
           </CardContent>
         </Card>
      </div>
      
    </div>
  );
}
