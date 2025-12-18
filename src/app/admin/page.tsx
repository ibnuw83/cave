'use client';

import { useEffect, useState } from 'react';
import { getCaves, getAllSpots, getAllUsersAdmin } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mountain, MapPin, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Cave, Spot, UserProfile } from '@/lib/types';

interface Stat {
  title: string;
  value: number;
  icon: React.ReactNode;
  href: string;
}

export default function AdminDashboard() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (userProfile?.role === 'admin') {
        try {
          const [caves, spots, users] = await Promise.all([
            getCaves(true),
            getAllSpots(),
            getAllUsersAdmin(),
          ]);
          setStats([
            { title: 'Total Gua', value: caves.length, icon: <Mountain className="h-6 w-6 text-muted-foreground" />, href: '/admin/caves' },
            { title: 'Total Spot', value: spots.length, icon: <MapPin className="h-6 w-6 text-muted-foreground" />, href: '/admin/spots' },
            { title: 'Total Pengguna', value: users.length, icon: <Users className="h-6 w-6 text-muted-foreground" />, href: '/admin/users' },
          ]);
        } catch (error) {
          console.error("Failed to fetch admin data:", error);
          // Error is handled by global permission toast
        } finally {
          setLoading(false);
        }
      }
    }
    fetchData();
  }, [userProfile]);

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang di Admin Panel Penjelajah Gua.</p>
      </header>
      
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
         <Card className="flex flex-col justify-between">
           <CardHeader>
             <CardTitle>Kelola Gua</CardTitle>
             <p className="text-muted-foreground pt-2">Tambah, edit, atau hapus data gua yang tersedia di aplikasi.</p>
           </CardHeader>
           <CardContent>
             <Button asChild>
                <Link href="/admin/caves">
                  Buka Manajemen Gua <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
             </Button>
           </CardContent>
         </Card>
          <Card className="flex flex-col justify-between">
           <CardHeader>
             <CardTitle>Kelola Spot</CardTitle>
             <p className="text-muted-foreground pt-2">Atur spot penjelajahan di setiap gua, termasuk konten premium.</p>
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
