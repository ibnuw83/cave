
'use client';

import { useState, useMemo, useEffect } from 'react';
import { UserProfile } from '@/lib/types';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useFirestore } from '@/app/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserForm } from './user-form';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { collection, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

export default function UsersClient() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const usersRef = collection(firestore, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
      setUsers(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);


  const sortedUsers = useMemo(() => {
    if (!users) return [];
    return [...users].sort((a, b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || ''));
  }, [users]);
  
  const handleRoleChange = async (uid: string, newRole: UserProfile['role']) => {
    if (currentUser?.uid === uid) {
      toast({ variant: 'destructive', title: 'Ditolak', description: 'Anda tidak dapat mengubah peran akun sendiri.' });
      return;
    }

    if (newRole === 'admin') {
      const ok = confirm('Yakin ingin menjadikan pengguna ini sebagai ADMIN? Tindakan ini memberikan akses penuh ke panel admin.');
      if (!ok) return;
    }

    setLoadingStates(prev => ({ ...prev, [uid]: true }));
    
    try {
      const userDocRef = doc(firestore, 'users', uid);
      await updateDoc(userDocRef, { role: newRole });
      // Custom claims update should be handled by a Cloud Function for security.
      // For this app, we rely on Firestore role and security rules.
      toast({ title: "Berhasil", description: `Peran pengguna telah diubah.` });
    } catch (error: any) {
       toast({ variant: 'destructive', title: 'Gagal', description: error.message || 'Gagal mengubah peran. Pastikan Anda memiliki izin.' });
    } finally {
        setLoadingStates(prev => ({ ...prev, [uid]: false }));
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
      const userDocRef = doc(firestore, 'users', uid);
      await updateDoc(userDocRef, { disabled: isDisabled });
      // Auth user status update should be handled by a Cloud Function.
      // Here we only update Firestore which should be used to control app access.
      toast({ title: 'Berhasil', description: `Pengguna telah ${isDisabled ? 'dinonaktifkan' : 'diaktifkan'}.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Gagal', description: error.message || 'Gagal mengubah status. Pastikan Anda memiliki izin.' });
    } finally {
      setLoadingStates(prev => ({ ...prev, [uid]: false }));
    }
  };

  const handleDelete = async (userToDelete: UserProfile) => {
    if (currentUser?.uid === userToDelete.id) {
       toast({ variant: 'destructive', title: 'Aksi Ditolak', description: 'Anda tidak bisa menghapus akun Anda sendiri.' });
       return;
    }

    setLoadingStates(prev => ({ ...prev, [userToDelete.id]: true }));
    try {
      const userDocRef = doc(firestore, 'users', userToDelete.id);
      await deleteDoc(userDocRef);
      // Deleting the Firebase Auth user should be handled by a secure Cloud Function
      // triggered by this Firestore deletion.
      toast({ title: 'Berhasil', description: `Profil pengguna ${userToDelete.displayName} telah dihapus dari Firestore.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Gagal', description: error.message || 'Gagal menghapus profil pengguna. Pastikan Anda memiliki izin.' });
    } finally {
       setLoadingStates(prev => ({ ...prev, [userToDelete.id]: false }));
    }
  };

  const handleFormSave = () => {
    setIsFormOpen(false);
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
                          Tindakan ini akan menghapus profil pengguna <strong>{user.displayName || user.email}</strong> dari database. Tindakan ini tidak dapat diurungkan.
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
