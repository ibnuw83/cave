
'use client';

import { useEffect, useState } from 'react';
import { getCaves, getAllSpotsForAdmin, getAllUsersAdmin } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mountain, MapPin, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Cave, Spot, UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';

interface Stat {
  title: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  color: string;
}

export default function AdminDashboard() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (userProfile?.role === 'admin') {
        try {
          // Promise.all will now correctly throw if any of the fetches fail
          const [caves, spots, users] = await Promise.all([
            getCaves(true),
            getAllSpotsForAdmin(),
            getAllUsersAdmin(),
          ]);
          setStats([
            { title: 'Total Gua', value: caves.length, icon: <Mountain className="h-6 w-6" />, href: '/admin/caves', color: 'bg-blue-900/50 text-blue-100' },
            { title: 'Total Spot', value: spots.length, icon: <MapPin className="h-6 w-6" />, href: '/admin/spots', color: 'bg-green-900/50 text-green-100' },
            { title: 'Total Pengguna', value: users.length, icon: <Users className="h-6 w-6" />, href: '/admin/users', color: 'bg-yellow-900/50 text-yellow-100' },
          ]);
        } catch (error) {
          // The errors are now caught here, but the permission error toast is handled globally.
          // We can just log that fetching failed.
          console.error("Failed to fetch admin dashboard data due to permission errors or other issues.");
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
