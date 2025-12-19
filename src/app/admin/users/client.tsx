
'use client';

import { useState, useMemo } from 'react';
import { collection, doc } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';
import { updateUserRole } from '@/lib/firestore';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollection, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function UsersClient() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { user: currentUser } = useUser();
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);

  const handleRoleChange = (uid: string, newRole: 'free' | 'pro' | 'admin') => {
    if (!users) return;
    const userToChange = users.find(u => u.id === uid); // use `id` from useCollection
    
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
    
    updateUserRole(uid, newRole);

    toast({ title: "Memperbarui", description: `Mengubah peran untuk ${userToChange.displayName || userToChange.email}...` });
    
    setTimeout(() => {
      setLoadingStates((prev) => ({ ...prev, [uid]: false }));
    }, 1500);
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
            <div className="flex items-center gap-2 w-full md:w-auto max-w-[120px]">
               {loadingStates[user.id] && <Loader2 className="h-5 w-5 animate-spin" />}
              <Select
                value={user.role}
                onValueChange={(value: 'free' | 'pro' | 'admin') => handleRoleChange(user.id, value)}
                disabled={loadingStates[user.id] || currentUser?.uid === user.id}
              >
                <SelectTrigger className="w-full" data-uid={user.id}>
                  <SelectValue placeholder="Pilih peran" />
                </SelectTrigger>
                <SelectContent data-uid-select={user.id}>
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
