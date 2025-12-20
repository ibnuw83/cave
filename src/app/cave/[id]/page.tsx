'use client';

import { useParams } from 'next/navigation';
import CaveClient from '@/app/components/cave-client';

export default function CavePage() {
  const params = useParams();
  const locationId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  // Logika pengambilan data dan penanganan loading/error sekarang
  // sepenuhnya ditangani di dalam komponen CaveClient.
  return <CaveClient locationId={locationId} />;
}
