import { getLocations } from "@/lib/firestore-admin";
import KioskClient from "./client";
import { Location } from "@/lib/types";

export default async function KioskSettingsPage() {
  // Fetch initial locations on the server
  const locations: Location[] = await getLocations(true).catch(() => []);

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Pengaturan Aplikasi</h1>
        <p className="text-muted-foreground">Kelola pengaturan umum dan mode kios.</p>
      </header>
      <div className="space-y-8">
          <KioskClient 
            initialLocations={locations}
          />
      </div>
    </div>
  );
}
