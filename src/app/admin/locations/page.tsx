
import LocationsClient from "./client";
import { getLocations } from "@/lib/firestore-admin";
import { Location } from "@/lib/types";

export const revalidate = 0; // Disable caching for this admin page

export default async function LocationsPage() {
  let initialLocations: Location[] = [];
  try {
    // Fetch initial locations on the server to avoid a flash of empty content
    initialLocations = await getLocations(true);
  } catch (error) {
    // If fetching fails on server, client will try to refetch.
    console.error("Failed to fetch initial locations on server:", error);
  }

  return (
    <div className="p-4 md:p-8">
       <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Manajemen Lokasi</h1>
        <p className="text-muted-foreground">Kelola semua data lokasi seperti gua dan situs sejarah.</p>
      </header>
      <LocationsClient initialLocations={initialLocations} />
    </div>
  );
}
