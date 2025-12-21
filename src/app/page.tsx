import HomeClient from '@/app/components/home-client';

export default function Home() {
  // This is now a Server Component.
  // All client-side logic, data fetching, and loading states are handled within HomeClient.
  return <HomeClient />;
}
