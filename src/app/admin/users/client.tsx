
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

  const handleRoleChange = (uid: string, newRole: 'free' | 'pro' | 'admin') => {
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
             // To revert the select dropdown visual state if the user cancels
             const selectTrigger = document.querySelector(`[data-uid="${uid}"]`) as HTMLElement | null;
             if (selectTrigger) {
                selectTrigger.click(); // Close the dropdown
                setTimeout(() => {
                   const previousRole = userToChange.role;
                   const roleSelect = document.querySelector(`[data-uid-select="${uid}"]`) as HTMLSelectElement | null;
                   if(roleSelect) {
                     // This is tricky as we can't directly set the value of a shadcn select.
                     // The UI will visually revert on the next re-render from Firestore anyway.
                   }
                }, 100);
             }
             return;
        }
    }

    setLoadingStates((prev) => ({ ...prev, [uid]: true }));
    
    // The updateUserRole function now handles its own error via the emitter.
    updateUserRole(uid, newRole);

    // We can show a success toast optimistically. The UI will update via the listener.
    toast({ title: "Memperbarui", description: `Mengubah peran untuk ${userToChange.displayName || userToChange.email}...` });
    
    // No try/catch needed here anymore, but we need to reset loading state.
    // A better approach would be to wait for the Firestore listener to confirm the change.
    // For now, a simple timeout works for visual feedback.
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
                <SelectTrigger className="w-full" data-uid={user.uid}>
                  <SelectValue placeholder="Pilih peran" />
                </SelectTrigger>
                <SelectContent data-uid-select={user.uid}>
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
