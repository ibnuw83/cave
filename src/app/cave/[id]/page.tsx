
import { notFound } from 'next/navigation';
import { getLocation, getSpotsForLocation } from '@/lib/firestore-admin';
import CaveClient from './client';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const location = await getLocation(params.id);
    if (!location) {
      return { title: 'Lokasi Tidak Ditemukan' };
    }
    return {
      title: `${location.name} | Cave Explorer 4D`,
      description: location.description,
    };
  } catch (error) {
    console.error("Failed to generate metadata for cave page:", error);
    return { title: 'Error', description: 'Gagal memuat metadata untuk lokasi ini.' };
  }
}

function CavePageFallback() {
    return (
        <div className="container mx-auto min-h-screen max-w-5xl p-4 md:p-8">
            <header className="mb-8">
                <Skeleton className="h-9 w-48 mb-4" />
                <Skeleton className="h-64 w-full rounded-lg" />
            </header>
            <main>
                <div className="mb-6">
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-5 w-80" />
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-60 w-full" />
                    <Skeleton className="h-60 w-full" />
                    <Skeleton className="h-60 w-full" />
                </div>
            </main>
        </div>
    );
}


export default async function CavePage({ params }: Props) {
  const { id } = params;

  const location = await getLocation(id);
  
  if (!location) {
    notFound();
  }

  const spots = await getSpotsForLocation(id);

  return (
    <Suspense fallback={<CavePageFallback />}>
      <CaveClient initialLocation={location} initialSpots={spots} />
    </Suspense>
  );
}
