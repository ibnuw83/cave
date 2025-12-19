'use client';

import HomeClient from '@/app/components/home-client';
import { Cave } from '@/lib/types';

export default function Home() {
  // Logika pengambilan data dan loading state dipindahkan ke dalam HomeClient
  // untuk mencegah 'Rendered fewer hooks than expected' error.
  return (
    <HomeClient />
  );
}
