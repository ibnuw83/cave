import { getCave, getSpots } from '@/lib/firestore';
import { notFound } from 'next/navigation';
import CaveClient from '@/app/components/cave-client';
import { personalizedCaveAmbience } from '@/ai/flows/personalized-cave-ambience';

export default async function CavePage({ params }: { params: { id: string } }) {
  const cave = await getCave(params.id);

  if (!cave) {
    notFound();
  }

  const spots = await getSpots(params.id);

  const ambience = await personalizedCaveAmbience({
    caveName: cave.name,
    caveDescription: cave.description,
    caveCoverImage: cave.coverImage
  });
  
  return <CaveClient cave={cave} spots={spots} ambienceDescription={ambience.ambienceDescription} />;
}
