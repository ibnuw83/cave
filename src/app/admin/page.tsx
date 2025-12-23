
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mountain, MapPin, Users, DatabaseZap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getLocations, getSpotsForLocation, getAllUsersAdmin } from '@/lib/firestore-admin';
import { AdminSeedButton } from './admin-seed-button';

interface Stat {
  title: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  color: string;
}

export const revalidate = 0; // Ensure fresh data on every visit

export default async function AdminDashboard() {

  const locations = await getLocations(true).catch(() => []);
  const allSpots = (await Promise.all(locations.map(l => getSpotsForLocation(l.id)))).flat();
  const allUsers = await getAllUsersAdmin().catch(() => []);

  const stats: Stat[] = [
    { title: 'Total Lokasi', value: locations.length, icon: <Mountain className="h-6 w-6" />, href: '/admin/locations', color: 'bg-blue-900/50 text-blue-100' },
    { title: 'Total Spot', value: allSpots.length, icon: <MapPin className="h-6 w-6" />, href: '/admin/spots', color: 'bg-green-900/50 text-green-100' },
    { title: 'Total Pengguna', value: allUsers.length, icon: <Users className="h-6 w-6" />, href: '/admin/users', color: 'bg-yellow-900/50 text-yellow-100' },
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

      <div className="mt-8 grid gap-4 md:grid-cols-2">
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
         <Card>
           <CardHeader>
             <CardTitle>Data Awal (Seeding)</CardTitle>
             <p className="text-muted-foreground pt-2">Isi database dengan data lokasi & spot awal untuk pengembangan.</p>
           </CardHeader>
           <CardContent>
             <AdminSeedButton />
             <p className="text-xs text-muted-foreground mt-3">Tindakan ini akan menghapus semua lokasi dan spot yang ada saat ini.</p>
           </CardContent>
         </Card>
      </div>
      
    </div>
  );
}
