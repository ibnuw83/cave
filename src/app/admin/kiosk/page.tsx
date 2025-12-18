
import { getCaves, getKioskSettings } from "@/lib/firestore";
import KioskClient from "./client";

export default async function KioskSettingsPage() {
  // Fetch all necessary data in parallel
  // Spots are now fetched client-side in KioskClient
  const [caves, kioskSettings] = await Promise.all([
    getCaves(true),      // include inactive caves for selection
    getKioskSettings()
  ]);

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Pengaturan Aplikasi</h1>
        <p className="text-muted-foreground">Kelola pengaturan umum dan mode kios.</p>
      </header>
      <div className="space-y-8">
        <KioskClient 
          initialCaves={caves}
          initialSettings={kioskSettings}
        />
      </div>
    </div>
  );
}

    
