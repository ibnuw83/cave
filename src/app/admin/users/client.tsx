
'use client';

import { useState, useMemo } from 'react';
import { UserProfile } from '@/lib/types';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useAuth, useCollection, useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserForm } from './user-form';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { collection } from 'firebase/firestore';


export default function UsersClient() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // This hook will only run after AdminLayout confirms the user is an admin.
  const usersRef = collection(firestore, 'users');
  const { data: users, isLoading } = useCollection<UserProfile>(usersRef);

  const sortedUsers = useMemo(() => {
    if (!users) return [];
    return [...users].sort((a, b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || ''));
  }, [users]);
  
  const handleRoleChange = async (uid: string, newRole: UserProfile['role']) => {
    const userToChange = users?.find(u => u.id === uid);
    
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
            // Re-fetch to revert visual state if user cancels confirm dialog
            // Note: This is a simple way; a more robust solution might involve optimistic UI state management
            return;
        }
    }

    setLoadingStates((prev) => ({ ...prev, [uid]: true }));
    
    try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("Otentikasi Gagal.");

        const response = await fetch('/api/admin/users/role', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ uid, role: newRole })
        });
      
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Gagal mengubah peran.');
        }

        toast({ title: "Berhasil", description: `Peran untuk ${userToChange.displayName || userToChange.email} telah diubah.` });
        // The useCollection hook will automatically update the UI
    } catch (error: any) {
       toast({ variant: 'destructive', title: 'Gagal', description: error.message });
       // The hook will eventually get the correct state from Firestore, reverting the UI.
    } finally {
        setLoadingStates((prev) => ({ ...prev, [uid]: false }));
    }
  };
  
  const handleStatusChange = async (userToUpdate: UserProfile, isDisabled: boolean) => {
    const uid = userToUpdate.id;
    if (currentUser?.uid === uid) {
      toast({ variant: 'destructive', title: 'Aksi Ditolak', description: 'Anda tidak dapat menonaktifkan akun sendiri.' });
      return;
    }

    setLoadingStates(prev => ({ ...prev, [uid]: true }));
    try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("Otentikasi Gagal.");

        const response = await fetch(`/api/admin/users/${uid}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ disabled: isDisabled }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Gagal mengubah status pengguna.');
        }

        toast({ title: 'Berhasil', description: `Pengguna telah ${isDisabled ? 'dinonaktifkan' : 'diaktifkan'}.` });
        // Let useCollection handle the UI update
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Gagal', description: error.message });
    } finally {
      setLoadingStates(prev => ({ ...prev, [uid]: false }));
    }
  };

  const handleDelete = async (userToDelete: UserProfile) => {
    if (currentUser?.uid === userToDelete.id) {
       toast({ variant: 'destructive', title: 'Aksi Ditolak', description: 'Anda tidak bisa menghapus akun Anda sendiri.' });
       return;
    }
    if (!auth.currentUser) return;

    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus pengguna.');
      }
      toast({ title: 'Berhasil', description: `Pengguna ${userToDelete.displayName} telah dihapus.` });
      // Firestore document is deleted by API, useCollection will update the list
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Gagal', description: error.message });
    }
  };

  const handleFormSave = () => {
    setIsFormOpen(false);
    // useCollection will handle the refresh
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end mb-4">
            <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  return (
    <>
     <UserForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleFormSave}
      />
    <div className="flex justify-end mb-4">
      <Button onClick={() => { setIsFormOpen(true); }}>
        <UserPlus className="mr-2 h-4 w-4" />
        Tambah Pengguna
      </Button>
    </div>

    <div className="space-y-4">
      {sortedUsers.map((user) => (
        <Card key={user.id}>
          <CardHeader>
             <div className="flex items-center space-x-4">
                <Avatar>
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback>{(user.displayName || user.email || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <CardTitle className="text-lg">{user.displayName || 'Tanpa Nama'}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
             <div className="flex items-center gap-4 flex-wrap">
                 <div className="flex items-center gap-2 w-[140px] flex-shrink-0">
                   {loadingStates[user.id] && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
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
                 <div className="flex items-center space-x-2">
                    <Switch
                        id={`status-${user.id}`}
                        checked={!user.disabled}
                        onCheckedChange={(isChecked) => handleStatusChange(user, !isChecked)}
                        disabled={loadingStates[user.id] || currentUser?.uid === user.id}
                    />
                    <Label htmlFor={`status-${user.id}`} className={user.disabled ? 'text-muted-foreground' : ''}>
                        {user.disabled ? 'Nonaktif' : 'Aktif'}
                    </Label>
                </div>
            </div>
             <div className="flex gap-2 self-end md:self-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={currentUser?.uid === user.id || loadingStates[user.id]}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Hapus
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Pengguna Ini?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tindakan ini akan menghapus akun <strong>{user.displayName || user.email}</strong> secara permanen dari Authentication dan Firestore. Ini tidak dapat diurungkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(user)}>
                          Ya, Hapus Pengguna
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
          </CardContent>
        </Card>
      ))}
       {sortedUsers.length === 0 && !isLoading && (
        <div className="text-muted-foreground text-sm text-center py-10">
          Tidak ada pengguna untuk ditampilkan.
        </div>
      )}
    </div>
    </>
  );
}
