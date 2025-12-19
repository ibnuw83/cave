
import { getCaves } from "@/lib/firestore";
import KioskClient from "./client";

export default async function KioskSettingsPage() {
  // Fetch only the caves data server-side.
  // Kiosk settings and spots will now be fetched client-side in real-time.
  const caves = await getCaves(true);

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Pengaturan Aplikasi</h1>
        <p className="text-muted-foreground">Kelola pengaturan umum dan mode kios.</p>
      </header>
      <div className="space-y-8">
        <KioskClient 
          initialCaves={caves}
        />
      </div>
    </div>
  );
}
