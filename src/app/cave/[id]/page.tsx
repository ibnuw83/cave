import type { Metadata } from 'next';
import { getLocation } from '@/lib/firestore';
import CaveClient from '@/app/components/cave-client';
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
    title: `${location.name} - Penjelajah Gua 4D`,
    description: location.description,
    openGraph: {
      title: location.name,
      description: location.description,
      images: [
        {
          url: location.coverImage,
          width: 1200,
          height: 630,
          alt: location.name,
        },
      ],
    },
  }
}

export default async function CavePage({ params }: Props) {
  const location = await getLocation(params.id);

  if (!location) {
    notFound();
  }

  return <CaveClient location={location} />;
}
