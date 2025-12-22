
import { getLocations } from "@/lib/firestore-admin";
import SpotsClient from "./client";
import { Location } from "@/lib/types";

export default async function SpotsPage() {
  let locations: Location[] = [];

  try {
    locations = await getLocations(true);
  } catch (error) {
    console.error("[SpotsPage] Failed to load locations:", error);
    // locations will remain an empty array, which is a safe value for SpotsClient
  }

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
