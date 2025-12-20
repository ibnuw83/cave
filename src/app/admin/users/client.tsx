'use client';

import { useState, useMemo, useEffect } from 'react';
import { UserProfile } from '@/lib/types';
import { updateUserRole } from '@/lib/firestore';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/firebase';

export default function UsersClient({ initialUsers }: { initialUsers: UserProfile[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { user: currentUser } = useUser();

  // Effect to update local state if the initialUsers prop changes.
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const handleRoleChange = async (uid: string, newRole: UserProfile['role']) => {
    const userToChange = users.find(u => u.id === uid);
    
    if (currentUser?.uid === uid) {
      toast({
        variant: 'destructive',
        title: 'Ditolak',
        description: 'Anda tidak dapat mengubah peran akun sendiri.',
      });
      return;
    }
    
    if (!userToChange || userToChange.role === newRole) {
      return;
    }
    
    if (newRole === 'admin') {
        const ok = confirm('Yakin ingin menjadikan pengguna ini sebagai ADMIN? Tindakan ini memberikan akses penuh ke panel admin.');
        if (!ok) {
             return;
        }
    }

    setLoadingStates((prev) => ({ ...prev, [uid]: true }));
    
    try {
        await updateUserRole(uid, newRole);
        // Optimistically update the UI
        setUsers(currentUsers => 
            currentUsers.map(u => u.id === uid ? { ...u, role: newRole } : u)
        );
        toast({ title: "Berhasil", description: `Peran untuk ${userToChange.displayName || userToChange.email} telah diubah.` });
    } catch (error) {
        // Error will be shown by the global error handler
    } finally {
        setLoadingStates((prev) => ({ ...prev, [uid]: false }));
    }
  };
  
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || ''));
  }, [users]);


  return (
    <div className="space-y-4">
      {sortedUsers.map((user) => (
        <Card key={user.id}>
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
            <div className="flex items-center gap-2 w-full md:w-auto max-w-[140px]">
               {loadingStates[user.id] && <Loader2 className="h-5 w-5 animate-spin" />}
              <Select
                value={user.role}
                onValueChange={(value: UserProfile['role']) => handleRoleChange(user.id, value)}
                disabled={loadingStates[user.id] || currentUser?.uid === user.id}
              >
                <SelectTrigger className="w-full" data-uid={user.id}>
                  <SelectValue placeholder="Pilih peran" />
                </SelectTrigger>
                <SelectContent data-uid-select={user.id}>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro1">PRO 1</SelectItem>
                  <SelectItem value="pro2">PRO 2</SelectItem>
                  <SelectItem value="pro3">PRO 3</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>
      ))}
       {sortedUsers.length === 0 && <p className="text-center text-muted-foreground">Tidak ada pengguna yang terdaftar.</p>}
    </div>
  );
}
