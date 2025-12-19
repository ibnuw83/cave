
import HomeClient from '@/app/components/home-client';
import { getCaves } from '@/lib/firestore';

// This is now a Server Component that fetches data directly.
export default async function Home() {
  // Fetch active caves directly on the server.
  // The client component will only handle UI interaction.
  const initialCaves = await getCaves(false);
  
  return (
    <HomeClient initialCaves={initialCaves} />
  );
}
