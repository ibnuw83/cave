
import type { Metadata } from 'next';
import CaveClient from './client';
import { notFound } from 'next/navigation';
import { getLocation } from '@/lib/firestore-admin';
import { getSpotsForLocation } from '@/lib/firestore-admin';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const location = await getLocation(params.id);
    if (location) {
      return {
        title: location.name,
        description: `Jelajahi spot-spot menakjubkan di ${location.name}.`,
      };
    }
  } catch (error) {
    // Fallback metadata on error
    console.error(`[Metadata] Failed to fetch location ${params.id}:`, error);
  }

  return {
    title: `Lokasi Tidak Ditemukan`,
    description: `Data untuk lokasi ini tidak dapat dimuat.`,
  };
}

export default async function CavePage({ params }: Props) {
  const locationId = params.id;

  if (!locationId) {
    notFound();
  }
  
  const location = await getLocation(locationId);
  
  // If no location is found, trigger the 404 page immediately.
  if (!location) {
    notFound();
  }

  // Fetch spots for the location
  const spots = await getSpotsForLocation(locationId);

  return <CaveClient initialLocation={location} initialSpots={spots} />;
}
