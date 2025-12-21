import type { Metadata } from 'next';
import { getLocation } from '@/lib/firestore-admin';
import CaveClient from './client';
import { notFound } from 'next/navigation';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Metadata fetching MUST remain on the server.
  const location = await getLocation(params.id);

  if (!location) {
    return {
      title: 'Lokasi Tidak Ditemukan',
      description: 'Lokasi yang Anda cari tidak dapat ditemukan.',
    };
  }

  return {
    title: `${location.name} - Cave Explorer 4D`,
    description: location.description,
  };
}

export default async function CavePage({ params }: Props) {
  // We can do a quick check here to see if the location exists at all,
  // to show a 404 if the URL is completely invalid or the location is not active.
  const locationExists = await getLocation(params.id);
  if (!locationExists) {
    notFound();
  }

  // The Server Component now only passes the ID to the Client Component.
  // All data fetching for the UI will happen on the client.
  return <CaveClient locationId={params.id} />;
}

    