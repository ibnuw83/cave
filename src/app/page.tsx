'use server';

import HomeClient from '@/app/components/home-client';

export default async function Home() {
  // Data caves sekarang akan diambil di sisi klien oleh HomeClient
  return <HomeClient />;
}
