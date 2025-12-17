import { getCaves, getAllSpots } from "@/lib/firestore";
import SpotsClient from "./client";

export default async function SpotsPage() {
  const spots = await getAllSpots();
  const caves = await getCaves(true);

  return (
    <div className="p-4 md:p-8">
       <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Manajemen Spot</h1>
        <p className="text-muted-foreground">Kelola semua spot penjelajahan.</p>
      </header>
      <SpotsClient initialSpots={spots} caves={caves} />
    </div>
  );
}
