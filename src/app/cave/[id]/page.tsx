
import type { Metadata } from 'next';
import { getLocationClient } from '@/lib/firestore-client';
import { getLocation, getSpots } from '@/lib/firestore-admin';
import CaveClient from './client';
import { notFound } from 'next/navigation';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // We use getLocationClient here because it's safe to use in both server/client
  // and doesn't depend on the Admin SDK, preventing build/dev errors.
  const location = await getLocationClient(params.id);

  if (!location) {
    // Jangan panggil notFound() di sini.
    // Cukup kembalikan metadata default agar halaman tidak rusak.
    return {
      title: 'Lokasi Tidak Ditemukan',
      description: 'Data untuk lokasi ini tidak dapat dimuat.',
    };
  }

  return {
    title: `${location.name} - Cave Explorer 4D`,
    description: location.description,
  };
}

export default async function CavePage({ params }: Props) {
  // For the actual page render, we use the server-side admin function.
  const location = await getLocation(params.id);
  
  if (!location) {
    // Komponen fallback ini sekarang akan ditampilkan dengan benar.
    return (
        <div className="flex items-center justify-center min-h-screen p-8 text-center text-white">
            <div>
                <h1 className="text-2xl font-bold">Lokasi tidak tersedia</h1>
                <p className="opacity-70 mt-2">
                    Data untuk lokasi ini tidak dapat dimuat. Mungkin sedang ada masalah pada server atau data telah dihapus.
                </p>
            </div>
        </div>
    );
  }

  // Jika lokasi ditemukan (termasuk placeholder), lanjutkan render.
  const spots = await getSpots(params.id);

  return <CaveClient location={location} spots={spots} />;
}
