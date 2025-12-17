import { getSpot } from '@/lib/firestore';
import { notFound } from 'next/navigation';
import SpotClient from '@/app/components/spot-client';

export default async function SpotPage({ params }: { params: { id: string } }) {
  const spot = await getSpot(params.id);
  
  if (!spot) {
    notFound();
  }

  return <SpotClient spot={spot} />;
}
