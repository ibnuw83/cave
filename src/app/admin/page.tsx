
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mountain, MapPin, Users, Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/firebase';

interface Stat {
  title: string;
  value: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

export default function AdminDashboard() {
  const auth = useAuth();
  const [counts, setCounts] = useState({ locations: '...', spots: '...', users: '...' });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        if (!auth.currentUser) {
          throw new Error("Pengguna tidak terautentikasi.");
        }
        
        const token = await auth.currentUser.getIdToken();
        const headers = { 'Authorization': `Bearer ${token}` };

        const [locationsRes, spotsRes, usersRes] = await Promise.all([
          fetch('/api/admin/locations', { headers }),
          fetch('/api/admin/spots', { headers }),
          fetch('/api/admin/users', { headers }),
        ]);

        if (!locationsRes.ok || !spotsRes.ok || !usersRes.ok) {
            throw new Error("Gagal mengambil sebagian atau semua data dasbor.");
        }

        const locations = await locationsRes.json();
        const spots = await spotsRes.json();
        const users = await usersRes.json();

        setCounts({
          locations: locations.length.toString(),
          spots: spots.length.toString(),
          users: users.length.toString(),
        });
      } catch (error: any) {
        console.error("Gagal mengambil jumlah dasbor admin:", error);
        setCounts({ locations: 'N/A', spots: 'N/A', users: 'N/A' });
      }
    };

    if (auth.currentUser) {
        fetchCounts();
    }
  }, [auth.currentUser]);

  const stats: Stat[] = [
    { title: 'Total Lokasi', value: counts.locations, icon: <Mountain className="h-6 w-6" />, href: '/admin/locations', color: 'bg-blue-900/50 text-blue-100' },
    { title: 'Total Spot', value: counts.spots, icon: <MapPin className="h-6 w-6" />, href: '/admin/spots', color: 'bg-green-900/50 text-green-100' },
    { title: 'Total Pengguna', value: counts.users, icon: <Users className="h-6 w-6" />, href: '/admin/users', color: 'bg-yellow-900/50 text-yellow-100' },
  ];

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
                <div className="text-3xl font-bold">{stat.value}</div>
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
