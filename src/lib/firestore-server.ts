import 'server-only';

import { initializeAdminApp } from '@/firebase/admin';
import { Location } from './types';

export async function getLocations(includeInactive = false): Promise<Location[]> {
    const { db } = await initializeAdminApp();
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('locations');

    if (!includeInactive) {
        query = query.where('isActive', '==', true);
    }
    
    const snapshot = await query.get();
    if (snapshot.empty) {
        return [];
    }
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
}
