import type { Metadata } from 'next';
import { getLocation, getSpots } from '@/lib/firestore-admin';
import CaveClient from './client';
import { notFound } from 'next/navigation';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const location = await getLocation(params.id);

  if (!location) {
    notFound();
  }

  return {
    title: `${location.name} - Cave Explorer 4D`,
    description: location.description,
  };
}

export default async function CavePage({ params }: Props) {
  const location = await getLocation(params.id);
  if (!location || !location.isActive) {
    notFound();
  }

  const spots = await getSpots(params.id);

  return <CaveClient location={location} spots={spots} />;
}
