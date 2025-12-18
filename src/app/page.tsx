'use server';

import { getCaves } from '@/lib/firestore';
import { Cave } from '@/lib/types';
import ClientHomePage from './client-home-page';
import placeholderImagesData from '@/lib/placeholder-images.json';

export default async function Home() {
  // Ambil data dari Firestore
  let firestoreCaves: Cave[] = [];
  try {
    firestoreCaves = await getCaves(false);
  } catch (error) {
    console.error("Gagal mengambil data dari Firestore, akan menggunakan data contoh:", error);
  }

  // Siapkan data contoh statis dari file JSON
  const placeholderImages = placeholderImagesData.placeholderImages;
  const jomblangCover = placeholderImages.find(p => p.id === 'cave-jomblang-cover')?.imageUrl;
  const gongCover = placeholderImages.find(p => p.id === 'cave-gong-cover')?.imageUrl;
  const petrukCover = placeholderImages.find(p => p.id === 'cave-petruk-cover')?.imageUrl;

  const staticCaves: Cave[] = [];

  if (jomblangCover) {
    staticCaves.push({
      id: 'static-jomblang',
      name: 'Gua Jomblang (Contoh)',
      description: 'Gua vertikal dengan cahaya surga yang menakjubkan.',
      coverImage: jomblangCover,
      isActive: true,
    });
  }

  if (gongCover) {
    staticCaves.push({
      id: 'static-gong',
      name: 'Gua Gong (Contoh)',
      description: 'Dijuluki sebagai gua terindah di Asia Tenggara.',
      coverImage: gongCover,
      isActive: true,
    });
  }
  
  if (petrukCover) {
    staticCaves.push({
        id: 'static-petruk',
        name: 'Gua Petruk (Contoh)',
        description: 'Gua Petruk di Kebumen adalah destinasi wisata alam karst yang menawarkan pengalaman caving (susur gua) menantang.',
        coverImage: petrukCover,
        isActive: true,
    });
  }


  // Gabungkan data dari Firestore dan data statis
  // Hapus duplikat berdasarkan nama gua
  const combinedCaves = [...firestoreCaves];
  staticCaves.forEach(staticCave => {
    if (!firestoreCaves.some(fc => fc.name.includes(staticCave.name.replace(' (Contoh)', '')))) {
      combinedCaves.push(staticCave);
    }
  });
  
  // Jika tidak ada data sama sekali, tampilkan data contoh
  const finalCaves = combinedCaves.length > 0 ? combinedCaves : staticCaves;
  
  return <ClientHomePage initialCaves={finalCaves} />;
}
