
import { adminDb } from '@/firebase/admin';
import { collection, writeBatch, getDocs } from 'firebase/firestore';
import type { Location, Spot } from './types';

const locationsData: Omit<Location, 'id'>[] = [
  {
    name: 'Gua Jomblang',
    category: 'Gua',
    description: 'Gua vertikal dengan fenomena cahaya surga yang menakjubkan di Gunung Kidul, Yogyakarta.',
    coverImage: 'https://images.unsplash.com/photo-1531874993088-51b60dda4452?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxjYXZlJTIwbGlnaHR8ZW58MHx8fHwxNzY1OTc3NTIyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    isActive: true,
    miniMap: { nodes: [], edges: [] },
  },
  {
    name: 'Gua Gong',
    category: 'Gua',
    description: 'Salah satu gua terindah di Asia Tenggara yang terletak di Pacitan, Jawa Timur, dengan stalaktit dan stalagmit yang memukau.',
    coverImage: 'https://images.unsplash.com/photo-1528459142917-0b5678471b63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxjYWxpZm9ybmlhJTIwY2F2ZXxlbnwwfHx8fDE3MjE4OTYzNTZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    isActive: true,
    miniMap: { nodes: [], edges: [] },
  },
];

const spotsData: { locationName: string; spots: Omit<Spot, 'id'|'locationId'>[] }[] = [
  {
    locationName: 'Gua Jomblang',
    spots: [
      {
        order: 1,
        title: 'Cahaya dari Surga',
        description: 'Sinar matahari menembus lubang gua, menciptakan pilar cahaya magis yang menyinari dasar gua yang gelap.',
        imageUrl: 'https://images.unsplash.com/photo-1531874993088-51b60dda4452?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxjYXZlJTIwbGlnaHR8ZW58MHx8fHwxNzY1OTc3NTIyfDA&ixlib=rb-4.1.0&q=80&w=1080',
        isPro: false,
        viewType: 'panorama',
        effects: { vibrationPattern: [100, 50, 100] },
      },
      {
        order: 2,
        title: 'Hutan Purba',
        description: 'Vegetasi lebat yang tumbuh subur di dasar gua, sebuah ekosistem unik yang terisolasi dari dunia luar.',
        imageUrl: 'https://images.unsplash.com/photo-1617482012115-325f6170094a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxjYXZlcnxlbnwwfHx8fDE3MjE4OTYzMjZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
        isPro: true,
        viewType: 'flat',
      },
    ],
  },
  {
    locationName: 'Gua Gong',
    spots: [
      {
        order: 1,
        title: 'Ruang Kristal',
        description: 'Formasi stalaktit dan stalagmit raksasa yang berkilauan seperti kristal di bawah sorotan lampu.',
        imageUrl: 'https://images.unsplash.com/photo-1568809957712-6ae80d87e533?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxzdGFsYWN0aXRlJTIwY2F2ZXxlbnwwfHx8fDE3NjU5Nzc1MjJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
        isPro: false,
        viewType: 'panorama',
      },
      {
        order: 2,
        title: 'Sendang Bidadari',
        description: 'Sebuah kolam air jernih di dalam gua yang dipercaya memiliki khasiat magis oleh masyarakat setempat.',
        imageUrl: 'https://images.unsplash.com/photo-1506352943274-c817554039c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHx1bmRlcmdyb3VuZCUyMGxha2V8ZW58MHx8fHwxNzIxODk2NDQxfDA&ixlib=rb-4.1.0&q=80&w=1080',
        isPro: true,
        viewType: 'panorama',
      },
    ],
  },
];

export async function seedInitialData() {
  const batch = writeBatch(adminDb);
  
  // Clear existing locations and spots
  const locationsCollection = collection(adminDb, 'locations');
  const spotsCollection = collection(adminDb, 'spots');
  
  const [existingLocationsSnap, existingSpotsSnap] = await Promise.all([
    getDocs(locationsCollection),
    getDocs(spotsCollection),
  ]);

  existingLocationsSnap.forEach(doc => batch.delete(doc.ref));
  existingSpotsSnap.forEach(doc => batch.delete(doc.ref));

  // Add new locations
  const locationNameToId: { [key: string]: string } = {};

  for (const locData of locationsData) {
    const locRef = collection(adminDb, 'locations').doc();
    batch.set(locRef, locData);
    locationNameToId[locData.name] = locRef.id;
  }

  // Add new spots associated with the new locations
  for (const spotGroup of spotsData) {
    const locationId = locationNameToId[spotGroup.locationName];
    if (locationId) {
      for (const spotData of spotGroup.spots) {
        const spotRef = collection(adminDb, 'spots').doc();
        batch.set(spotRef, { ...spotData, locationId });
      }
    }
  }

  // Commit the batch
  await batch.commit();
}
