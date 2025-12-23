import HomeClient from '@/app/components/home-client';
import { getKioskSettings } from '@/lib/firestore-admin';
import type { KioskSettings } from '@/lib/types';

// This forces the page to be dynamically rendered, ensuring fresh data.
export const dynamic = 'force-dynamic';

export default async function Home() {
  const settings: KioskSettings | null = await getKioskSettings();

  // The HomeClient component is now responsible for its own data fetching on the client-side
  // for a more interactive experience, but we pass server-fetched settings to it.
  return <HomeClient initialSettings={settings} />;
}
