'use client';

import { useEffect, useState } from 'react';
import { getKioskSettings } from "@/lib/firestore-client";
import KiosClient from "./client";
import { KioskSettings } from "@/lib/types";
import { Loader2 } from 'lucide-react';

export default function KiosPage() {
  const [settings, setSettings] = useState<KioskSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const fetchedSettings = await getKioskSettings();
        if (fetchedSettings && fetchedSettings.playlist?.length) {
          setSettings(fetchedSettings);
        } else {
          setError("Kios belum dikonfigurasi dari Panel Admin.");
        }
      } catch (err) {
        console.error("Failed to load kiosk settings:", err);
        setError("Gagal memuat pengaturan kios.");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-white text-center p-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-xl text-muted-foreground">Memeriksa konfigurasi kios...</p>
        </div>
      </div>
    );
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
