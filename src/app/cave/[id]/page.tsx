import type { Metadata } from 'next';
import { getLocation, getSpots } from '@/lib/firestore-server';
import CaveClient from './client';
import { notFound } from 'next/navigation';

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const location = await getLocation(params.id);
 
  if (!location) {
    return {
      title: 'Lokasi Tidak Ditemukan',
      description: 'Lokasi yang Anda cari tidak dapat ditemukan.',
    }
  }

  return {
    title: `${location.name} - C.A.V.E Experience`,
    description: location.description,
  };
}

export default async function CavePage({ params }: Props) {
  const location = await getLocation(params.id);

  if (!location) {
    notFound();
  }

  const spots = await getSpots(location.id);

  return <CaveClient location={location} initialSpots={spots} />;
}
