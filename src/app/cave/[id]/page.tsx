
import type { Metadata } from 'next';
import { getLocation, getSpots } from '@/lib/firestore-admin';
import CaveClient from './client';
import { notFound } from 'next/navigation';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const location = await getLocation(params.id);

    if (!location) {
      return {
        title: 'Lokasi Tidak Ditemukan',
        description: 'Lokasi ini tidak tersedia.',
      };
    }

    return {
      title: `${location.name} - Cave Explorer 4D`,
      description: location.description,
    };
  } catch {
    // 🔒 JANGAN THROW, JANGAN notFound
    return {
      title: 'Cave Explorer 4D',
      description: 'Pengalaman eksplorasi virtual 4D.',
    };
  }
}

export default async function CavePage({ params }: Props) {
  const location = await getLocation(params.id);

  if (!location) {
    notFound(); // ✅ DI SINI BOLEH
  }

  const spots = await getSpots(params.id);

  return <CaveClient location={location} spots={spots} />;
}
