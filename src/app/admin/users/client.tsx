'use client';

import { useState, useMemo } from 'react';
import { collection } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';
import { updateUserRole } from '@/lib/firestore';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth as useFirebaseAuth } from '@/context/auth-context';
import { useCollection } from '@/firebase';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function UsersClient() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { user: currentUser } = useFirebaseAuth();

  const usersQuery = useMemo(() => collection(db, 'users'), []);
  const { data: users, loading: usersLoading } = useCollection<UserProfile>(usersQuery);

  const handleRoleChange = async (uid: string, newRole: 'free' | 'pro' | 'admin') => {
    if (!users) return;
    const userToChange = users.find(u => u.uid === uid);
    
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
      // UI will update automatically via the real-time listener.
      toast({ title: "Berhasil", description: "Peran pengguna berhasil diperbarui." });
    } catch (error: any) {
       // Central error handler in firestore.ts will show a toast.
       // No need to show a generic one here unless the error is not permission-denied.
       if (error.code !== 'permission-denied') {
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
  
  const sortedUsers = useMemo(() => {
    if (!users) {
        return [];
    }
    return [...users].sort((a, b) => a.displayName?.localeCompare(b.displayName || '') || 0);
  }, [users]);


  if (usersLoading) {
      return (
          <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
          </div>
      )
  }

  return (
    <div className="space-y-4">
      {sortedUsers.map((user) => (
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
                disabled={loadingStates[user.uid] || currentUser?.uid === user.uid}
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
