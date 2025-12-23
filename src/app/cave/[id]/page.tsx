import type { Metadata } from 'next';
import CaveClient from './client';
import { notFound } from 'next/navigation';

type Props = {
  params: { id: string };
};

// Metadata can be generated on the client if needed, or kept static
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    return {
      title: `Lokasi ${params.id}`,
      description: `Jelajahi detail lokasi ${params.id}.`,
    };
}

export default async function CavePage({ params }: Props) {
  const locationId = params.id;

  if (!locationId) {
    notFound();
  }

  // The client component will handle fetching its own data
  return <CaveClient locationId={locationId} />;
}

    