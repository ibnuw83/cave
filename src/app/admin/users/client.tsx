
'use client';

import { useState, useMemo, useEffect } from 'react';
import { UserProfile } from '@/lib/types';
import { updateUserRole, getAllUsersAdmin } from '@/lib/firestore-client';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserForm } from './user-form';


export default function UsersClient() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { user: currentUser } = useUser();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);


  const fetchUsers = () => {
    setLoading(true);
    getAllUsersAdmin()
      .then(setUsers)
      .catch(() => {
        // Error is handled by the global error handler
        setUsers([]); // Set to empty array on error
      })
      .finally(() => setLoading(false));
  };
  
  useEffect(() => {
    if (!isFormOpen) {
      fetchUsers();
    }
  }, [isFormOpen]);

  const handleRoleChange = async (uid: string, newRole: UserProfile['role']) => {
    const userToChange = users.find(u => u.id === uid);
    
    if (currentUser?.uid === uid) {
      toast({
        variant: 'destructive',
        title: 'Ditolak',
        description: 'Anda tidak dapat mengubah peran akun sendiri.',
      });
      // Revert the UI change
      setTimeout(() => {
        const select = document.querySelector(`[data-uid="${uid}"]`) as HTMLElement;
        if (select) select.click(); // This is a bit of a hack to close and reopen, reverting visual state
      }, 100);
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

  const handleDelete = async (userToDelete: UserProfile) => {
    if (currentUser?.uid === userToDelete.id) {
       toast({ variant: 'destructive', title: 'Aksi Ditolak', description: 'Anda tidak bisa menghapus akun Anda sendiri.' });
       return;
    }
    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus pengguna.');
      }
      toast({ title: 'Berhasil', description: `Pengguna ${userToDelete.displayName} telah dihapus.` });
      fetchUsers(); // Refresh list
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Gagal', description: error.message });
    }
  };

  const handleFormSave = () => {
    setIsFormOpen(false);
    setSelectedUser(null);
    fetchUsers(); // Refresh user list after saving
  };
  
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || ''));
  }, [users]);
  

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <>
     <UserForm
        user={selectedUser}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleFormSave}
      />
    <div className="flex justify-end mb-4">
      <Button onClick={() => { setSelectedUser(null); setIsFormOpen(true); }}>
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
                    <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <CardTitle className="text-lg">{user.displayName || 'Tanpa Nama'}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
             <div className="flex items-center gap-2 w-full md:w-auto max-w-[140px] flex-shrink-0">
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
             <div className="flex gap-2 self-end md:self-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={currentUser?.uid === user.id}
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
       {sortedUsers.length === 0 && !loading && (
        <div className="text-muted-foreground text-sm text-center py-10">
          Tidak ada pengguna untuk ditampilkan.
        </div>
      )}
    </div>
    </>
  );
}

