import UsersClient from "./client";

export default function UsersPage() {
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
      {/* The client component will now handle its own data fetching */}
      <UsersClient />
    </div>
  );
}
