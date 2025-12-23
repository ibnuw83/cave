
import SpotPageClient from './client';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSpot, getSpotsForLocation } from '@/lib/firestore-admin';

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const spot = await getSpot(params.id);
    if (spot) {
      return {
        title: `${spot.title} - Cave Explorer 4D`,
        description: `Jelajahi detail dari spot ${spot.title}.`,
      };
    }
  } catch (error) {
    console.error(`[Metadata] Failed to fetch spot ${params.id}:`, error);
  }
  
  return {
    title: `Spot Tidak Ditemukan`,
    description: `Data untuk spot ini tidak dapat dimuat.`,
  };
}

export default async function SpotPage({ params }: Props) {
  const spotId = params.id;
  
  if (!spotId) {
    notFound();
  }

  const spot = await getSpot(spotId);

  if (!spot) {
    notFound();
  }

  // Fetch all other spots in the same location for navigation
  const allSpotsInLocation = await getSpotsForLocation(spot.locationId);

  return (
    <SpotPageClient initialSpot={spot} allSpotsInLocation={allSpotsInLocation} />
  );
}
