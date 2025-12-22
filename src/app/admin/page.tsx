
'use client';

import { useEffect, useState } from 'react';
import { getLocations, getAllSpotsForAdmin, getAllUsersAdmin } from '@/lib/firestore-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mountain, MapPin, Users, ArrowRight, DatabaseZap, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


interface Stat {
  title: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  color: string;
}

function MigrationCard() {
  const { toast } = useToast();
  const [isMigrating, setIsMigrating] = useState(false);

  const handleMigration = async () => {
    setIsMigrating(true);
    try {
      const response = await fetch('/api/admin/migrate-locations', {
        method: 'POST',
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Migrasi gagal.');
      }
      toast({
        title: 'Migrasi Berhasil',
        description: result.message,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Migrasi Gagal',
        description: error.message,
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Migrasi Data Lama</CardTitle>
        <CardDescription>Pindahkan data dari koleksi 'caves' ke 'locations'. Lakukan ini hanya sekali.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Tombol ini akan menyalin semua data dari koleksi `caves` ke `locations` dan kemudian menghapus koleksi `caves`. Pastikan Anda belum melakukannya sebelumnya.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isMigrating}>
              {isMigrating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DatabaseZap className="mr-2 h-4 w-4" />}
              Mulai Migrasi
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini akan menyalin data dari `caves` ke `locations` dan menghapus koleksi `caves` secara permanen. Ini tidak dapat diurungkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleMigration}>Ya, Lanjutkan</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}


export default function AdminDashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (user) {
        try {
          const [locations, spots, users] = await Promise.all([
            getLocations(true),
            getAllSpotsForAdmin(),
            getAllUsersAdmin(),
          ]);
          setStats([
            { title: 'Total Lokasi', value: locations.length, icon: <Mountain className="h-6 w-6" />, href: '/admin/locations', color: 'bg-blue-900/50 text-blue-100' },
            { title: 'Total Spot', value: spots.length, icon: <MapPin className="h-6 w-6" />, href: '/admin/spots', color: 'bg-green-900/50 text-green-100' },
            { title: 'Total Pengguna', value: users.length, icon: <Users className="h-6 w-6" />, href: '/admin/users', color: 'bg-yellow-900/50 text-yellow-100' },
          ]);
        } catch (error) {
          console.error("Failed to fetch admin dashboard data due to permission errors or other issues.");
        } finally {
          setLoading(false);
        }
      }
    }
    if (user) {
      fetchData();
    }
  }, [user]);

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
      
      <div className="mt-8">
        <MigrationCard />
      </div>
    </div>
  );
}
