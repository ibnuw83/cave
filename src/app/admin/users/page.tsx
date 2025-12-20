import UsersClient from "./client";
import { getAllUsersAdmin } from "@/lib/firestore";
import { UserProfile } from "@/lib/types";

export default async function UsersPage() {
    const users: UserProfile[] = await getAllUsersAdmin().catch(() => []);

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Manajemen Pengguna</h1>
        <p className="text-muted-foreground">Kelola peran (role) pengguna.</p>
      </header>
      <UsersClient initialUsers={users} />
    </div>
  );
}
