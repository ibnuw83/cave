import { getKioskSettings } from "@/lib/firestore-admin";
import KiosClient from "./client";
import { KioskSettings } from "@/lib/types";

export const dynamic = 'force-dynamic';

export default async function KiosPage() {
  let settings: KioskSettings | null = null;
  let error: string | null = null;

  try {
    const fetchedSettings = await getKioskSettings();
    if (fetchedSettings && fetchedSettings.playlist?.length) {
      settings = fetchedSettings;
    } else {
      error = "Kios belum dikonfigurasi dari Panel Admin.";
    }
  } catch (err) {
    console.error("Failed to load kiosk settings:", err);
    error = "Gagal memuat pengaturan kios.";
  }

  if (error || !settings) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-white text-center p-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">Mode Kios Tidak Aktif</h1>
          <p className="text-xl text-muted-foreground">
            {error || "Kios belum dikonfigurasi dari Panel Admin."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black text-white overflow-hidden">
      <KiosClient settings={settings} />
    </div>
  );
}
