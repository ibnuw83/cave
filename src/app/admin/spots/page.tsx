
import { getLocations, getSpotsForLocation } from "@/lib/firestore-admin";
import SpotsClient from "./client";
import { Location, Spot } from "@/lib/types";

export const revalidate = 0; // Disable caching for this admin page

export default async function SpotsPage() {
  let locations: Location[] = [];
  let spots: Spot[] = [];

  try {
    locations = await getLocations(true);
    // Fetch all spots from all locations initially
    const spotPromises = locations.map(loc => getSpotsForLocation(loc.id));
    const spotsByLocation = await Promise.all(spotPromises);
    spots = spotsByLocation.flat();
  } catch (error) {
    console.error("[SpotsPage] Failed to load initial data:", error);
  }

  return (
    <div className="p-4 md:p-8">
       <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Manajemen Spot</h1>
        <p className="text-muted-foreground">Kelola semua spot penjelajahan.</p>
      </header>
      <SpotsClient locations={locations} initialSpots={spots} />
    </div>
  );
}
