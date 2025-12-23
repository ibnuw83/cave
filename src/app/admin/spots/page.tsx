'use client';

import SpotsClient from "./client";

// This page now just acts as a container for the client component.
// The client component will handle its own data fetching.
export default function SpotsPage() {

  return (
    <div className="p-4 md:p-8">
       <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Manajemen Spot</h1>
        <p className="text-muted-foreground">Kelola semua spot penjelajahan.</p>
      </header>
      <SpotsClient />
    </div>
  );
}
