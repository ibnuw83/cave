
import HomeClient from '@/app/components/home-client';
import { getLocations } from '@/lib/firestore-admin';
import { getKioskSettings } from '@/lib/firestore-admin';

export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  // This is now a Server Component that fetches initial data.
  // This helps with SEO and faster perceived load times.
  const locations = await getLocations(false).catch(() => []);
  const settings = await getKioskSettings().catch(() => null);

  return <HomeClient initialLocations={locations} initialSettings={settings} />;
}
