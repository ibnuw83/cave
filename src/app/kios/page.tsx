import { getKioskSettings, getSpots, getCave } from '@/lib/firestore';
import { notFound } from 'next/navigation';
import KioskModeClient from './client';

export const dynamic = 'force-dynamic';

export default async function KioskPage() {
  const settings = await getKioskSettings();

  if (!settings || !settings.playlist || settings.playlist.length === 0) {
    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-black text-white p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">Mode Kios Belum Dikonfigurasi</h1>
            <p className="text-xl text-muted-foreground">Silakan atur daftar putar spot di Panel Admin pada bagian Pengaturan Kios.</p>
        </div>
    );
  }

  // Fetch all spots from the playlist
  const spotIds = settings.playlist.map(p => p.spotId);
  const spotDocs = await Promise.all(spotIds.map(id => getSpots(settings.caveId).then(spots => spots.find(s => s.id === id))));
  const spots = spotDocs.filter(Boolean); // Filter out any undefined spots

  if (spots.length === 0) {
     return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-black text-white p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">Spot Tidak Ditemukan</h1>
            <p className="text-xl text-muted-foreground">Spot yang ada di daftar putar tidak dapat ditemukan. Periksa kembali pengaturan kios di Panel Admin.</p>
        </div>
    );
  }
  
  // Reorder spots based on playlist and add duration
  const playlistWithData = settings.playlist.map(item => {
      const spot = spots.find(s => s.id === item.spotId);
      return spot ? { ...spot, duration: item.duration } : null;
  }).filter(Boolean);


  return <KioskModeClient playlist={playlistWithData as any[]} />;
}
