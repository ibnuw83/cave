// lib/offline.ts
'use client';

import { Cave, Spot, OfflineCaveData } from './types';

const CACHE_NAME = 'penjelajah-gua-offline-v1';
const CAVE_DATA_KEY_PREFIX = 'cave-data-';

// --- Helper Functions ---

const getCaveDataKey = (caveId: string) => `${CAVE_DATA_KEY_PREFIX}${caveId}`;

/**
 * Caches multiple files.
 * @param urls Array of URLs to cache.
 */
async function cacheFiles(urls: string[]): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const validUrls = urls.filter(url => url && typeof url === 'string');
    await cache.addAll(validUrls);
  } catch (error) {
    console.error('Failed to cache files:', error);
    // Don't re-throw, as some files might fail but others succeed (e.g., optional audio)
  }
}

// --- Public API for Offline Management ---

/**
 * Saves all data for a specific cave for offline use.
 * @param cave The cave object.
 * @param spots An array of spots belonging to the cave.
 */
export async function saveCaveForOffline(cave: Cave, spots: Spot[]): Promise<void> {
  const caveDataKey = getCaveDataKey(cave.id);
  const dataToStore: OfflineCaveData = {
    cave,
    spots,
    timestamp: Date.now(),
  };

  // 1. Cache the JSON metadata for the cave and spots
  const metadataResponse = new Response(JSON.stringify(dataToStore), {
    headers: { 'Content-Type': 'application/json' },
  });

  const cache = await caches.open(CACHE_NAME);
  await cache.put(caveDataKey, metadataResponse);

  // 2. Cache all associated media files (images, audio)
  const mediaUrls = [
    cave.coverImage,
    ...spots.map(spot => spot.imageUrl),
    ...spots.map(spot => spot.audioUrl).filter(Boolean), // Filter out undefined/empty audioUrls
  ];

  await cacheFiles(mediaUrls as string[]);
}

/**
 * Retrieves cached data for a specific cave.
 * @param caveId The ID of the cave to retrieve.
 * @returns The cached OfflineCaveData or null if not found.
 */
export async function getOfflineCaveData(caveId: string): Promise<OfflineCaveData | null> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(getCaveDataKey(caveId));
    if (!response) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching offline cave data:', error);
    return null;
  }
}

/**
 * Checks if a specific cave is available offline.
 * @param caveId The ID of the cave.
 * @returns True if the cave is cached, false otherwise.
 */
export async function isCaveAvailableOffline(caveId: string): Promise<boolean> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(getCaveDataKey(caveId));
    return !!response;
  } catch {
    return false;
  }
}

/**
 * Deletes all cached data for the application.
 */
export async function clearOfflineCache(): Promise<void> {
  try {
    await caches.delete(CACHE_NAME);
  } catch (error) {
    console.error('Failed to clear offline cache:', error);
    throw error; // Re-throw to be handled by the caller
  }
}

/**
 * Retrieves a cached resource (like an image or audio) from the cache.
 * This is useful for service workers or for manually loading from cache.
 * @param request The request or URL string.
 * @returns The cached response or null if not found.
 */
export async function getCachedAsset(request: Request | string): Promise<Response | null> {
    try {
        const cache = await caches.open(CACHE_NAME);
        const response = await cache.match(request);
        return response || null;
    } catch {
        return null;
    }
}
