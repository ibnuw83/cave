// lib/offline.ts
'use client';

import { Location, Spot, OfflineLocationData } from './types';

const CACHE_NAME = 'penjelajah-gua-offline-v1';
const LOCATION_DATA_KEY_PREFIX = 'location-data-';
const OFFLINE_INDEX_KEY = 'offline-index';

// --- Helper Functions ---

const getLocationDataKey = (locationId: string) => `${LOCATION_DATA_KEY_PREFIX}${locationId}`;

/**
 * Caches multiple files individually.
 * @param urls Array of URLs to cache.
 */
async function cacheFiles(urls: string[]): Promise<void> {
    const cache = await caches.open(CACHE_NAME);
    const validUrls = urls.filter(url => url && typeof url === 'string');

    for (const url of validUrls) {
        try {
            // Use no-cors mode to allow caching cross-origin resources
            // even if they don't have perfect CORS headers. This is safe
            // for opaque resources like images and audio where we don't
            // need to read the content directly in our code.
            const request = new Request(url, { mode: 'no-cors' });
            const response = await fetch(request);
            await cache.put(url, response);
        } catch (error) {
            console.warn(`Failed to cache individual file: ${url}`, error);
            // Continue to the next file instead of failing the whole operation
        }
    }
}


// --- Public API for Offline Management ---

/**
 * Saves all data for a specific location for offline use.
 * This function also updates the offline index.
 * @param location The location object.
 * @param spots An array of spots belonging to the location.
 */
export async function saveLocationForOffline(location: Location, spots: Spot[]): Promise<void> {
  const cache = await caches.open(CACHE_NAME);

  // 1. Update the offline index
  let offlineIndex: Record<string, string> = {};
  const indexResponse = await cache.match(OFFLINE_INDEX_KEY);
  if (indexResponse) {
    offlineIndex = await indexResponse.json();
  }
  spots.forEach(spot => {
    offlineIndex[spot.id] = location.id;
  });
  await cache.put(OFFLINE_INDEX_KEY, new Response(JSON.stringify(offlineIndex)));

  // 2. Cache the JSON metadata for the location and spots
  const locationDataKey = getLocationDataKey(location.id);
  const dataToStore: OfflineLocationData = {
    location,
    spots,
    timestamp: Date.now(),
  };
  const metadataResponse = new Response(JSON.stringify(dataToStore), {
    headers: { 'Content-Type': 'application/json' },
  });
  await cache.put(locationDataKey, metadataResponse);

  // 3. Cache all associated media files (images, audio)
  const mediaUrls = [
    location.coverImage,
    ...spots.map(spot => spot.imageUrl),
  ];
  await cacheFiles(mediaUrls as string[]);
}

/**
 * Retrieves cached data for a specific location.
 * @param locationId The ID of the location to retrieve.
 * @returns The cached OfflineLocationData or null if not found.
 */
export async function getOfflineLocationData(locationId: string): Promise<OfflineLocationData | null> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(getLocationDataKey(locationId));
    if (!response) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching offline location data:', error);
    return null;
  }
}

/**
 * Checks if a specific location is available offline.
 * @param locationId The ID of the location.
 * @returns True if the location is cached, false otherwise.
 */
export async function isLocationAvailableOffline(locationId: string): Promise<boolean> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(getLocationDataKey(locationId));
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
