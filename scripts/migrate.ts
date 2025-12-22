
import * as admin from 'firebase-admin';

// =============================
// INIT FIREBASE ADMIN
// =============================
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

// =============================
// MIGRATION SCRIPT
// =============================
async function migrateCavesToLocations() {
  const cavesRef = db.collection('caves');
  const locationsRef = db.collection('locations');

  const cavesSnap = await cavesRef.get();

  if (cavesSnap.empty) {
    console.log('❌ Tidak ada data di collection caves.');
    return;
  }

  console.log(`🔍 Ditemukan ${cavesSnap.size} dokumen di caves`);

  let migrated = 0;
  let skipped = 0;

  for (const doc of cavesSnap.docs) {
    const caveId = doc.id;
    const caveData = doc.data();

    const targetRef = locationsRef.doc(caveId);
    const targetSnap = await targetRef.get();

    if (targetSnap.exists) {
      console.log(`⏭️ SKIP: locations/${caveId} sudah ada`);
      skipped++;
      continue;
    }

    const locationData = {
      name: caveData.name ?? 'Unnamed Location',
      category: caveData.category ?? 'Gua',
      description: caveData.description ?? '',
      coverImage: caveData.coverImage ?? '',
      isActive: caveData.isActive ?? true,

      // 🔑 MiniMap wajib ada (biar UI aman)
      miniMap: caveData.miniMap ?? {
        nodes: [],
        edges: [],
      },

      // Metadata tambahan (optional)
      migratedFrom: 'caves',
      migratedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await targetRef.set(locationData);
    console.log(`✅ MIGRATED: caves/${caveId} ➜ locations/${caveId}`);
    migrated++;
  }

  console.log('==============================');
  console.log(`🎉 Migrasi selesai`);
  console.log(`✅ Migrated : ${migrated}`);
  console.log(`⏭️ Skipped  : ${skipped}`);
}

migrateCavesToLocations()
  .then(() => {
    console.log('🚀 DONE');
    process.exit(0);
  })
  .catch((err) => {
    console.error('🔥 ERROR:', err);
    process.exit(1);
  });
