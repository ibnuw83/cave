'use client';

import { useState } from 'react';
import { UserProfile } from '@/lib/types';
import { updateUserRole } from '@/lib/firestore';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FirestorePermissionError } from '@/lib/errors';

export default function UsersClient({ initialUsers }: { initialUsers: UserProfile[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const handleRoleChange = async (uid: string, newRole: 'free' | 'pro' | 'admin') => {
    setLoadingStates((prev) => ({ ...prev, [uid]: true }));
    try {
      await updateUserRole(uid, newRole);
      setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
      toast({ title: "Berhasil", description: "Peran pengguna berhasil diperbarui." });
    } catch (error) {
       if (!(error instanceof FirestorePermissionError)) {
            toast({
                variant: 'destructive',
                title: 'Gagal',
                description: 'Terjadi kesalahan saat memperbarui peran pengguna.',
            });
       }
    } finally {
      setLoadingStates((prev) => ({ ...prev, [uid]: false }));
    }
  };

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <Card key={user.uid}>
          <CardHeader className="flex flex-row items-center justify-between space-x-4">
             <div className="flex items-center space-x-4">
                <Avatar>
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{user.displayName || 'Tanpa Nama'}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto max-w-[120px]">
               {loadingStates[user.uid] && <Loader2 className="h-5 w-5 animate-spin" />}
              <Select
                value={user.role}
                onValueChange={(value: 'free' | 'pro' | 'admin') => handleRoleChange(user.uid, value)}
                disabled={loadingStates[user.uid]}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih peran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
