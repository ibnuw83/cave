
import { getCave, getSpots } from '@/lib/firestore';
import { notFound } from 'next/navigation';
import CaveClient from '@/app/components/cave-client';
import { Cave, Spot } from '@/lib/types';

// This component now ONLY fetches data from Firestore.
// All complex offline-first logic has been moved to the client if needed,
// but for initial load, direct fetching is more reliable.
export default async function CavePage({ params }: { params: { id: string } }) {
  const caveId = params.id;
  
  // Fetch cave and spots data in parallel for efficiency.
  const [cave, spots] = await Promise.all([
    getCave(caveId),
    getSpots(caveId)
  ]);

  // If the main resource (the cave) isn't found, show a 404 page.
  if (!cave) {
    notFound();
  }

  // Pass the reliably fetched data to the client component.
  // The spots array will be empty if getSpots found nothing, which is correct.
  return <CaveClient cave={cave} spots={spots} />;
}
