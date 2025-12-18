'use server';

import ClientHomePage from '@/app/client-home-page';
import { getCaves, addCave, addSpot } from '@/lib/firestore';

async function seedData() {
  const caves = await getCaves(true);
  if (caves.length > 0) {
    console.log('Data sudah ada, seeding tidak diperlukan.');
    return;
  }

  console.log('Database kosong, membuat data contoh...');

  try {
    // 1. Buat Gua Jomblang
    const jomblangId = await addCave({
      name: 'Gua Jomblang',
      description: 'Gua vertikal dengan cahaya surgawi yang menakjubkan di Gunungkidul.',
      coverImage: 'https://images.unsplash.com/photo-1531874993088-51b60dda4452?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxjYXZlJTIwbGlnaHR8ZW58MHx8fHwxNzY1OTc3NTIyfDA&ixlib=rb-4.1.0&q=80&w=1080',
      isActive: true,
    });

    await addSpot({
      caveId: jomblangId,
      order: 1,
      title: 'Cahaya dari Surga',
      description: 'Sinar matahari yang menerobos masuk ke dalam gua, menciptakan pemandangan magis.',
      imageUrl: 'https://images.unsplash.com/photo-1531874993088-51b60dda4452?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxjYXZlJTIwbGlnaHR8ZW58MHx8fHwxNzY1OTc3NTIyfDA&ixlib=rb-4.1.0&q=80&w=1080',
      isPro: false,
      effects: {},
    });
     await addSpot({
      caveId: jomblangId,
      order: 2,
      title: 'Hutan Purba',
      description: 'Hutan dengan vegetasi purba yang tumbuh subur di dasar gua.',
      imageUrl: 'https://images.unsplash.com/photo-1731400185777-6a4107598b7c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxtdWRkeSUyMHBhdGh8ZW58MHx8fHwxNzY1OTc3NTIyfDA&ixlib=rb-4.1.0&q=80&w=1080',
      isPro: true,
      effects: {},
    });

    // 2. Buat Gua Gong
    const gongId = await addCave({
      name: 'Gua Gong',
      description: 'Salah satu gua terindah di Asia Tenggara dengan stalaktit dan stalagmit yang memukau.',
      coverImage: 'https://images.unsplash.com/photo-1568809957712-6ae80d87e533?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxzdGFsYWN0aXRlJTIwY2F2ZXxlbnwwfHx8fDE3NjU5Nzc1MjJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      isActive: true,
    });
    
    await addSpot({
      caveId: gongId,
      order: 1,
      title: 'Ruang Kristal',
      description: 'Jelajahi keindahan formasi kristal yang berkilauan di dalam gua.',
      imageUrl: 'https://images.unsplash.com/photo-1684391706941-36813d87efe6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8c3RhbGFjdGl0ZSUyMGNsb3NldXB8ZW58MHx8fHwxNzY1OTc3NTIxfDA&ixlib=rb-4.1.0&q=80&w=1080',
      isPro: false,
      effects: {},
    });

     await addSpot({
      caveId: gongId,
      order: 2,
      title: 'Kolam Bidadari',
      description: 'Kolam air jernih di dalam gua yang dipercaya memiliki khasiat.',
      imageUrl: 'https://images.unsplash.com/photo-1646928987820-f5c2bed3872d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHx1bmRlcmdyb3VuZCUyMHBvb2x8ZW58MHx8fHwxNzY1OTc3NTIyfDA&ixlib=rb-4.1.0&q=80&w=1080',
      isPro: true,
      effects: {},
    });

    console.log('Data contoh berhasil dibuat.');
  } catch (error) {
      // Kita tidak akan memunculkan error ke user jika seeding gagal,
      // cukup log di console server.
      console.error("Gagal membuat data contoh:", error);
  }
}


export default async function Home() {
  // Panggil fungsi untuk membuat data contoh jika diperlukan.
  // Ini hanya akan berjalan di server saat halaman dirender.
  await seedData();
  
  // HomeClient akan diambil datanya di dalam ClientHomePage
  return <ClientHomePage />;
}
