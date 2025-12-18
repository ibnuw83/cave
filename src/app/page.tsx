
'use server';

import HomeClient from '@/app/components/home-client';
import { getCaves, addCave, addSpot } from '@/lib/firestore';
import { Cave, Spot } from '@/lib/types';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import placeholderImages from '@/lib/placeholder-images.json';

async function seedData() {
    const cavesRef = collection(db, 'caves');
    const existingCavesSnap = await getDocs(cavesRef);

    if (!existingCavesSnap.empty) {
        console.log("Data sudah ada, seeding tidak diperlukan.");
        return;
    }
    
    console.log("Belum ada data, memulai proses seeding...");

    const batch = writeBatch(db);

    const jomblangImage = placeholderImages.placeholderImages.find(p => p.id === 'cave-jomblang-cover')?.imageUrl || '';
    const gongImage = placeholderImages.placeholderImages.find(p => p.id === 'cave-gong-cover')?.imageUrl || '';

    const jomblangLightImage = placeholderImages.placeholderImages.find(p => p.id === 'spot-jomblang-light')?.imageUrl || '';
    const jomblangMudImage = placeholderImages.placeholderImages.find(p => p.id === 'spot-jomblang-mud')?.imageUrl || '';

    const gongStalactiteImage = placeholderImages.placeholderImages.find(p => p.id === 'spot-gong-stalactite')?.imageUrl || '';
    const gongPoolImage = placeholderImages.placeholderImages.find(p => p.id === 'spot-gong-pool')?.imageUrl || '';


    // --- CAVES ---
    const cavesToCreate: Omit<Cave, 'id'>[] = [
        {
            name: 'Gua Jomblang',
            description: 'Gua vertikal dengan cahaya surga yang menakjubkan.',
            coverImage: jomblangImage,
            isActive: true,
        },
        {
            name: 'Gua Gong',
            description: 'Dijuluki sebagai gua terindah di Asia Tenggara.',
            coverImage: gongImage,
            isActive: true,
        },
    ];

    const caveRefs = cavesToCreate.map(() => doc(collection(db, 'caves')));
    
    caveRefs.forEach((ref, i) => {
        batch.set(ref, cavesToCreate[i]);
    });

    const jomblangCaveId = caveRefs[0].id;
    const gongCaveId = caveRefs[1].id;

    // --- SPOTS ---
    const spotsToCreate: Omit<Spot, 'id'>[] = [
        {
            caveId: jomblangCaveId,
            order: 1,
            title: 'Cahaya dari Surga',
            description: 'Sinar matahari yang masuk melalui lubang gua, menciptakan pemandangan magis.',
            imageUrl: jomblangLightImage,
            isPro: false,
        },
        {
            caveId: jomblangCaveId,
            order: 2,
            title: 'Jalur Berlumpur',
            description: 'Tantangan jalur berlumpur sebelum mencapai dasar gua.',
            imageUrl: jomblangMudImage,
            isPro: true,
            effects: { vibrationPattern: [60, 40, 60] }
        },
        {
            caveId: gongCaveId,
            order: 1,
            title: 'Stalaktit Raksasa',
            description: 'Formasi batuan kapur yang menjulang dari langit-langit gua.',
            imageUrl: gongStalactiteImage,
            isPro: false,
        },
        {
            caveId: gongCaveId,
            order: 2,
            title: 'Kolam Bawah Tanah',
            description: 'Kolam air jernih yang terbentuk secara alami di dalam gua.',
            imageUrl: gongPoolImage,
            isPro: true,
        }
    ];

    spotsToCreate.forEach(spot => {
        const spotRef = doc(collection(db, 'spots'));
        batch.set(spotRef, spot);
    });

    try {
        await batch.commit();
        console.log("Seeding data contoh berhasil!");
    } catch (error) {
        console.error("Gagal melakukan seeding data:", error);
    }
}


export default async function Home() {
  await seedData();
  const caves = await getCaves(false);
  return <HomeClient initialCaves={caves} />;
}
