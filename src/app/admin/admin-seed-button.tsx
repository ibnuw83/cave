
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DatabaseZap } from 'lucide-react';

export function AdminSeedButton() {
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();

  const handleSeedData = async () => {
    if (!confirm('Anda yakin ingin mengisi database dengan data awal? Ini akan menghapus data lokasi dan spot yang ada.')) {
      return;
    }
    setIsSeeding(true);
    try {
      const response = await fetch('/api/admin/seed', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengisi data.');
      }
      toast({
        title: 'Berhasil!',
        description: 'Database telah diisi dengan data awal. Muat ulang halaman untuk melihat perubahan.',
      });
      // Optionally trigger a page reload or state refresh
      window.location.reload();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: error.message,
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Button onClick={handleSeedData} disabled={isSeeding}>
      <DatabaseZap className="mr-2 h-4 w-4" />
      {isSeeding ? 'Memproses...' : 'Isi Database dengan Data Awal'}
    </Button>
  );
}
