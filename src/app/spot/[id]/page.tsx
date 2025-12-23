import SpotPageClient from './client';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Metadata can be fetched on the client or be static
  return {
    title: `Spot ${params.id} - Cave Explorer 4D`,
    description: `Jelajahi detail dari spot ${params.id}.`,
  }
}

export default async function SpotPage({ params }: Props) {
  const spotId = params.id;
  
  if (!spotId) {
    notFound();
  }

  // The client component now handles all data fetching and logic
  return (
    <SpotPageClient spotId={spotId} />
  );
}

    