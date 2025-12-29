
import { getKioskSettings } from "@/lib/firestore-admin";
import KiosClient from "./client";
import { KioskSettings } from "@/lib/types";

export const dynamic = 'force-dynamic';

export default async function KiosPage() {
  let error: string | null = null;

  // We check for settings existence on the server to fail fast if not configured.
  // The full settings object will be fetched on the client.
  try {
    const settings = await getKioskSettings();
    if (!settings || !settings.playlist?.length) {
      error = "Kios belum dikonfigurasi dari Panel Admin.";
    }
  } catch (err) {
    console.error("Failed to pre-check kiosk settings:", err);
    error = "Gagal memuat pengaturan kios.";
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-white text-center p-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">Mode Kios Tidak Aktif</h1>
          <p className="text-xl text-muted-foreground">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black text-white overflow-hidden">
      <KiosClient />
    </div>
  );
}
