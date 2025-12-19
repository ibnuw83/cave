
'use client';

import UsersClient from "./client";
import { getAllUsersAdmin } from "@/lib/firestore";
import { UserProfile } from "@/lib/types";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAllUsersAdmin().then(u => {
            setUsers(u);
            setLoading(false);
        }).catch(err => {
            console.error("Failed to fetch users", err);
            setLoading(false);
        })
    }, []);

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Manajemen Pengguna</h1>
        <p className="text-muted-foreground">Kelola peran (role) pengguna.</p>
      </header>
       {loading ? (
           <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
          </div>
       ) : (
        <UsersClient initialUsers={users} />
       )}
    </div>
  );
}
