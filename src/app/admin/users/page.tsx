import UsersClient from "./client";
import { getAllUsersAdmin } from "@/lib/firestore-admin";
import { UserProfile } from "@/lib/types";

export default async function UsersPage() {
    const users: UserProfile[] = await getAllUsersAdmin();

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">
          Manajemen Pengguna
        </h1>
        <p className="text-muted-foreground">
          Kelola peran (role) pengguna.
        </p>
      </header>

      {users.length === 0 ? (
        <div className="text-muted-foreground text-sm">
          Data pengguna belum tersedia atau Admin SDK belum aktif.
        </div>
      ) : (
        <UsersClient initialUsers={users} />
      )}
    </div>
  );
}
