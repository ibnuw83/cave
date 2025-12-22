
import { getLocations } from "@/lib/firestore-admin";
import SpotsClient from "./client";
import { Location } from "@/lib/types";

export default async function SpotsPage() {
  const locations: Location[] = await getLocations(true).catch(() => []);

  return (
    <div className="p-4 md:p-8">
       <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Manajemen Spot</h1>
        <p className="text-muted-foreground">Kelola semua spot penjelajahan.</p>
      </header>
      <SpotsClient locations={locations} />
    </div>
  );
}
