import { getCaves } from '@/lib/firestore';
import { Cave } from '@/lib/types';
import HomeClient from '@/app/components/home-client';

export default async function Home() {
  const caves: Cave[] = await getCaves();

  return <HomeClient caves={caves} />;
}
