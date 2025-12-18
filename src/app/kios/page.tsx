
import { getKioskSettings } from "@/lib/firestore";
import KiosClient from "./client";
import { KioskSettings } from "@/lib/types";

export default async function KiosPage() {
  let settings: KioskSettings | null = null;

  try {
    settings = await getKioskSettings();
  } catch (err) {
    console.error("Failed to load kiosk settings:", err);
  }

  if (!settings || !settings.playlist?.length) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-white text-center p-8">
        <h1 className="text-3xl font-bold mb-4">Mode Kios Tidak Aktif</h1>
        <p className="text-xl text-muted-foreground">
          Kios belum dikonfigurasi dari Panel Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black text-white overflow-hidden">
      <KiosClient settings={settings} />
    </div>
  );
}
