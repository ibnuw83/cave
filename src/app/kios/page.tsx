
import KiosClient from "./client";

export const dynamic = 'force-dynamic';

export default async function KiosPage() {
  
  // The client will handle all logic, including fetching its own settings.
  // This simplifies the server component and avoids issues with pre-rendering kiosk settings.

  return (
    <div className="h-screen w-screen bg-black text-white overflow-hidden">
      <KiosClient />
    </div>
  );
}
